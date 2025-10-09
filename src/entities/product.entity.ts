import { Column, DataType, Model, Table, HasMany } from 'sequelize-typescript';
import { OrderItem } from './order-item.entity';

@Table({ tableName: 'products', timestamps: false })
export class Product extends Model<Product> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description?: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  price: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  stock: number;

  @HasMany(() => OrderItem)
  orderItems: OrderItem[];
}
