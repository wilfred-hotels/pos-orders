import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Table({ tableName: 'order_items', timestamps: false })
export class OrderItem extends Model<OrderItem> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  orderId: number;

  @BelongsTo(() => Order)
  order: Order;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId: number;

  @BelongsTo(() => Product)
  product: Product;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity: number;
}
