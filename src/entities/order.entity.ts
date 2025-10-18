import { Column, DataType, Model, Table, HasMany } from 'sequelize-typescript';
import { OrderItem } from './order-item.entity';

@Table({ tableName: 'orders', timestamps: true })
export class Order extends Model<Order> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @HasMany(() => OrderItem)
  declare items: OrderItem[];

  @Column({ type: DataType.FLOAT, allowNull: false })
  declare total: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare source: string; // 'ecom' | 'pos'
}
