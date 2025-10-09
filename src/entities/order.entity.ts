import { Column, DataType, Model, Table, HasMany } from 'sequelize-typescript';
import { OrderItem } from './order-item.entity';

@Table({ tableName: 'orders', timestamps: true })
export class Order extends Model<Order> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @HasMany(() => OrderItem)
  items: OrderItem[];

  @Column({ type: DataType.FLOAT, allowNull: false })
  total: number;

  @Column({ type: DataType.STRING, allowNull: false })
  source: string; // 'ecom' | 'pos'
}
