import {
  Column,
  DataType,
  Model,
  Table,
  HasMany,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { OrderItem } from './order-item.entity';
import { Hotel } from './hotel.entity';

@Table({ tableName: 'products', timestamps: false })
export class Product extends Model<Product> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description?: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  declare price: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare stock: number;

  @HasMany(() => OrderItem)
  declare orderItems: OrderItem[];

  @ForeignKey(() => Hotel)
  @Column({ type: DataType.UUID, allowNull: true })
  declare hotelId?: string;

  @BelongsTo(() => Hotel)
  declare hotel?: Hotel;
}
