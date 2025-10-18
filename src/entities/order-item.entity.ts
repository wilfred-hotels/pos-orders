import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Table({ tableName: 'order_items', timestamps: false })
export class OrderItem extends Model<OrderItem> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: false })
  declare orderId: string;

  @BelongsTo(() => Order)
  declare order: Order;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false })
  declare productId: string;

  @BelongsTo(() => Product)
  declare product: Product;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare quantity: number;
}
