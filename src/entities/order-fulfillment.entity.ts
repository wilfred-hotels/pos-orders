import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Order } from './order.entity';
import { Hotel } from './hotel.entity';
import { Product } from './product.entity';

@Table({ tableName: 'order_fulfillments', timestamps: true })
export class OrderFulfillment extends Model<OrderFulfillment> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: false })
  declare orderId: string;

  @ForeignKey(() => Hotel)
  @Column({ type: DataType.UUID, allowNull: true })
  declare assignedHotelId?: string;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: true })
  declare assignedProductId?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare assignedAt?: Date;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'pending' })
  declare status: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare priceBreakdown: any;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'unpaid' })
  declare payoutStatus: string;
}
