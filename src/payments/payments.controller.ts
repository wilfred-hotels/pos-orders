import { Controller, Post, Body, Logger, Get, Param, HttpCode, HttpStatus, BadRequestException, HttpException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MpesaService } from './mpesa.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly mpesaService: MpesaService,
  ) {}

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

      const createDto: CreatePaymentDto = {
        provider: 'mpesa',
        providerTransactionId: undefined,
        amount: String(amount),
        status: 'pending',
        raw: { initiated: res },
        cartId: cartId,
        userId: userId,
        initiatedCheckoutRequestId: initiatedCheckout,
        initiatedMerchantRequestId: initiatedMerchant,
      };

      const payment = await this.paymentsService.create(createDto);

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
}
