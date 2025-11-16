import { Model, Table, Column, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { Order } from './order.entity';
import { User } from './user.entity';
import { Hotel } from './hotel.entity';
import { Cart } from './cart.entity';

@Table({ tableName: 'payments' })
export class Payment extends Model<Payment> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare provider: string; // e.g. 'mpesa'

  @Column({ type: DataType.STRING })
  declare providerTransactionId?: string; // external transaction id from provider

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare amount: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'pending' })
  declare status: string; // pending | completed | failed | cancelled

  @Column({ type: DataType.JSONB })
  declare raw: any; // raw payload from provider

  @Column({ type: DataType.STRING, allowNull: true })
  declare initiatedCheckoutRequestId?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare initiatedMerchantRequestId?: string;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: true })
  declare orderId?: string;

  @BelongsTo(() => Order)
  declare order?: Order;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId?: string;

  @BelongsTo(() => User)
  declare user?: User;

  @ForeignKey(() => Hotel)
  @Column({ type: DataType.UUID, allowNull: true })
  declare hotelId?: string;

  @BelongsTo(() => Hotel)
  declare hotel?: Hotel;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
