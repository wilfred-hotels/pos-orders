import { Column, DataType, Model, Table, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { OrderItem } from './order-item.entity';
import { User } from './user.entity';
import { CatalogProduct } from './catalog-product.entity';

@Table({ tableName: 'orders', timestamps: true })
export class Order extends Model<Order> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: true, unique: true })
  declare code?: string;

  @Column({ type: DataType.ENUM('paid', 'not paid', 'canceled', 'pending'), allowNull: false, defaultValue: 'not paid' })
  declare status: 'paid' | 'not paid' | 'canceled' | 'pending';

  @Column({ type: DataType.UUID, allowNull: true })
  declare cartId?: string;

  @ForeignKey(() => CatalogProduct)
  @Column({ type: DataType.UUID, allowNull: true })
  declare catalogProductId?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare contact?: any;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare userId?: string;

  @BelongsTo(() => User)
  declare user?: User;

  @HasMany(() => OrderItem)
  declare items: OrderItem[];

  @Column({ type: DataType.FLOAT, allowNull: false })
  declare total: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare source: string; // 'ecom' | 'pos'
}
