import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Order } from '../entities/order.entity';

// NOTE: We intentionally import Order in case we want to validate order existence when matching callbacks.

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(@InjectModel(Payment) private paymentModel: typeof Payment) {}

  async create(createDto: CreatePaymentDto) {
    this.logger.debug('Creating payment', createDto);
    const payload: Partial<Payment> = {
      provider: createDto.provider,
      providerTransactionId: createDto.providerTransactionId,
      amount: createDto.amount,
      status: createDto.status ?? 'pending',
      raw: createDto.raw ?? {},
      orderId: createDto.orderId,
      userId: createDto.userId,
      hotelId: createDto.hotelId,
      cartId: createDto.cartId,
      initiatedCheckoutRequestId: (createDto as any).initiatedCheckoutRequestId,
      initiatedMerchantRequestId: (createDto as any).initiatedMerchantRequestId,
    };

    
    const p = await this.paymentModel.create(payload as any);

    return p;
  }

  async findById(id: string) {
    return this.paymentModel.findByPk(id);
  }

  /**
   * Record a payment from an M-Pesa callback payload.
   * This is the canonical place to create the definitive payment record.
   */
  async recordPaymentFromCallback(payload: any) {
    this.logger.debug('Recording payment from callback', { payload });

    const callback = payload?.Body?.stkCallback;
    if (!callback) {
      this.logger.warn('No stkCallback found in payload');
      return null;
    }

    const items = Array.isArray(callback?.CallbackMetadata?.Item) ? callback.CallbackMetadata.Item : [];
    const findByName = (name: string) => items.find((i: any) => i?.Name === name)?.Value;

    const amount = findByName('Amount') ?? null;
    const receipt = findByName('MpesaReceiptNumber') ?? null;
    const phone = findByName('PhoneNumber') ?? null;
    const checkoutRequestId = callback?.CheckoutRequestID ?? null;
    const resultCode = Number(callback?.ResultCode ?? -1);
    const status = resultCode === 0 ? 'completed' : 'failed';

    // First, try a fast DB lookup by the stored initiatedCheckoutRequestId column
    let saved: any = null;
    let match = null as any;
    if (checkoutRequestId) {
      match = await this.paymentModel.findOne({ where: { provider: 'mpesa', status: 'pending', initiatedCheckoutRequestId: checkoutRequestId } as any });
    }

    if (match) {
      // update existing pending
      match.providerTransactionId = receipt ?? checkoutRequestId;
      match.amount = amount != null ? String(amount) : match.amount || String(0);
      match.status = status;
      match.raw = { ...match.raw, callback: payload };
      saved = await match.save();
      this.logger.log('Updated pending payment from callback', { id: saved?.id, status });
    } else {
      // fallback: try to find a pending payment by scanning raw.initiated.CheckoutRequestID
      const pendingList = await this.paymentModel.findAll({ where: { provider: 'mpesa', status: 'pending' } });
      const rawMatch = pendingList.find((p: any) => {
        try {
          const init = p.raw?.initiated;
          return init && (init.CheckoutRequestID === checkoutRequestId || String(init.CheckoutRequestID) === String(checkoutRequestId));
        } catch (e) {
          return false;
        }
      });

      if (rawMatch) {
        rawMatch.providerTransactionId = receipt ?? checkoutRequestId;
        rawMatch.amount = amount != null ? String(amount) : rawMatch.amount || String(0);
        rawMatch.status = status;
        rawMatch.raw = { ...rawMatch.raw, callback: payload };
        saved = await rawMatch.save();
        this.logger.log('Updated pending payment from callback (raw match)', { id: saved?.id, status });
      } else {
        const createDto: CreatePaymentDto = {
          provider: 'mpesa',
          providerTransactionId: receipt ?? checkoutRequestId,
          amount: amount != null ? String(amount) : String(0),
          status,
          raw: payload,
        };
        saved = await this.paymentModel.create(createDto as any);
        this.logger.log('Created new payment from callback', { id: saved?.id, status });
      }
    }

    // If payment succeeded, and it's linked to a cart, update the corresponding order(s) to 'paid'
    try {
      if (status === 'completed' && saved?.cartId) {
        const [count] = await Order.update({ status: 'paid' } as any, { where: { cartId: saved.cartId } as any });
        this.logger.log(`Marked ${count} order(s) as paid for cartId=${saved.cartId}`);
      }
    } catch (e) {
      this.logger.error('Failed to update order status after payment', e as any);
    }

    return saved;
  }
}
