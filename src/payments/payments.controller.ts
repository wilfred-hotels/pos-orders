import { Controller, Post, Body, Logger, Get, Param, HttpCode, HttpStatus, BadRequestException, HttpException, UseGuards, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MpesaService } from './mpesa.service';
import { Order } from '../entities/order.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly mpesaService: MpesaService,
  ) { }

  @Post()
  async create(@Body() createDto: CreatePaymentDto) {
    this.logger.debug('Create payment request', createDto);
    return this.paymentsService.create(createDto);
  }

  @Post('mpesa/initiate')
  @HttpCode(HttpStatus.OK)
  async initiateMpesa(@Body() body: any) {
    this.logger.debug('Mpesa initiate request', body);

    const { phone, amount, accountReference, orderId, userId, hotelId, cartId } = body || {};

    if (!phone || !amount) {
      throw new BadRequestException('phone and amount are required');
    }

    try {
      const res = await this.mpesaService.initiateStkPush(phone, String(amount), accountReference, body?.transactionDesc);

      // Record a pending payment for reconciliation on callback. We store cartId (not hotelId) per design.
      const initiatedCheckout = res?.CheckoutRequestID ?? res?.checkoutRequestID ?? res?.CheckoutRequestId;
      const initiatedMerchant = res?.MerchantRequestID ?? res?.merchantRequestID ?? res?.MerchantRequestId;

      // Ensure we persist the hotelId. If the caller didn't provide one but an orderId
      // was supplied, try to infer the hotelId from the order's user or the first
      // item's product hotelId so reporting can be scoped correctly.
      let effectiveHotelId = hotelId;
      if (!effectiveHotelId && orderId) {
        try {
          // Lazily require related models to avoid circular import issues at module load
          const OrderItem = require('../entities/order-item.entity').OrderItem;
          const Product = require('../entities/product.entity').Product;
          const User = require('../auth/user.entity').User;

          const ord = await Order.findByPk(orderId, { include: [{ model: OrderItem, include: [Product] }, { model: User }] as any });
          if (ord) {
            // prefer order.user.hotelId, fallback to first item's product.hotelId
            effectiveHotelId = (ord as any)?.user?.hotelId ?? (ord as any)?.items?.[0]?.product?.hotelId ?? effectiveHotelId;
          }
        } catch (e) {
          this.logger.warn('Failed to infer hotelId from order: ' + ((e as any)?.message ?? e));
        }
      }

      const createDto: CreatePaymentDto = {
        provider: 'mpesa',
        providerTransactionId: undefined,
        amount: String(amount),
        status: 'pending',
        raw: { initiated: res },
        orderId: orderId,
        userId: userId,
        hotelId: effectiveHotelId,
        initiatedCheckoutRequestId: initiatedCheckout,
        initiatedMerchantRequestId: initiatedMerchant,
      };

      const payment = await this.paymentsService.create(createDto);

      // If an orderId was provided, mark that order as 'pending' while payment completes
      if (orderId) {
        try {
          await Order.update({ status: 'pending' } as any, { where: { id: orderId } as any });
          this.logger.log(`Marked order ${orderId} as pending`);
        } catch (e) {
          this.logger.warn(`Failed to mark order ${orderId} as pending: ${(e as any)?.message}`);
        }
      }

      return { message: 'STK push initiated', data: res, pendingPaymentId: payment?.id };
    } catch (err: any) {
      // Log the full error for observability
      this.logger.error('Failed to initiate mpesa push', err?.message ?? err);

      // Prefer to return the provider or internal error details in the response body for debugging,
      // but avoid leaking secrets. Include status and body when available from httpRequest helper.
      const status = err?.status || HttpStatus.BAD_GATEWAY;
      const body = err?.body ?? { message: err?.message ?? 'initiation_failed' };

      // Throw an HttpException so Nest returns the correct status code (not default 201)
      throw new HttpException({ success: false, error: body }, status);
    }
  }

  @Post('mpesa/callback')
  @HttpCode(HttpStatus.OK)
  async mpesaCallback(@Body() payload: any) {
    this.logger.debug('Mpesa callback received', payload);

    try {
      // Let MpesaService normalize/verify the payload if needed (it currently returns payload)
      const parsed = await this.mpesaService.handleCallback(payload);

      // Record the definitive payment result now that Safaricom has called back
      const recorded = await this.paymentsService.recordPaymentFromCallback(parsed);

      return { ResultCode: 0, ResultDesc: 'Callback received successfully', recordedId: recorded?.id };
    } catch (err) {
      this.logger.error('Error processing mpesa callback', err);
      // Always return 200 OK for provider callbacks so they don't retry repeatedly,
      // but include a success flag for internal observability.
      return { success: false, error: 'processing_failed' };
    }
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  // Query payments (manager+admin). Supports hotelId, status, provider, userId, date range, pagination
  @Get()
  @UseGuards(RolesGuard)
  @Roles('manager', 'admin')
  async query(
    @Query('hotelId') hotelId?: string,
    @Query('status') status?: string,
    @Query('provider') provider?: string,
    @Query('userId') userId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = pageStr ? Number(pageStr) || 1 : 1;
    const limit = limitStr ? Number(limitStr) || 25 : 25;
    return this.paymentsService.queryPayments({ hotelId, status, provider, userId, start, end, page, limit });
  }

  // Admin-only endpoint to record a cash payment and mark the order paid
  @Post('cash')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async recordCashPayment(@Body() body: { orderId: string; amount: string; userId?: string; hotelId?: string; note?: string }) {
    const { orderId, amount, userId, hotelId, note } = body || {};
    if (!orderId || !amount) throw new BadRequestException('orderId and amount are required');

    try {
      // mark order as paid
      await Order.update({ status: 'paid' } as any, { where: { id: orderId } as any });

      // record payment with provider 'cash'
      const createDto: CreatePaymentDto = {
        provider: 'cash',
        providerTransactionId: undefined,
        amount: String(amount),
        status: 'completed',
        raw: { note: note ?? 'cash_payment' },
        orderId,
        userId,
        hotelId,
      };

      const payment = await this.paymentsService.create(createDto);

      return { success: true, paymentId: payment?.id };
    } catch (e) {
      this.logger.error('Failed to record cash payment', (e as any)?.message ?? e);
      throw new HttpException({ success: false, error: (e as any)?.message ?? 'failed' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Payments statistics (manager+admin)
  @Get('stats/summary')
  @UseGuards(RolesGuard)
  @Roles('manager', 'admin')
  async statsSummary(@Query('hotelId') hotelId?: string) {
    return this.paymentsService.summaryCounts(hotelId);
  }

  @Get('stats/by-provider')
  @UseGuards(RolesGuard)
  @Roles('manager', 'admin')
  async statsByProvider() {
    return this.paymentsService.byProviderStats();
  }

  @Get('stats/revenue')
  @UseGuards(RolesGuard)
  @Roles('manager', 'admin')
  async statsRevenue(@Param('interval') intervalParam: string, @Body() body?: any) {
    // Accept query params via body or query is not ideal in this controller helper; accept via body for simplicity
    const interval = (body?.interval as 'daily' | 'weekly' | 'monthly') || (intervalParam as any) || 'daily';
    const start = body?.start;
    const end = body?.end;
    return this.paymentsService.revenueByInterval(interval, start, end);
  }

  @Get('stats/transactions-by-day')
  @UseGuards(RolesGuard)
  @Roles('manager', 'admin')
  async transactionsByDay(@Query('date') date?: string) {
    return this.paymentsService.transactionCountsForDate(date);
  }
}
