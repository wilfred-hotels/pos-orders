import { Column, DataType, Model, Table, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from '../auth/user.entity';
import { CartItem } from './cart-item.entity';

@Table({ tableName: 'carts', timestamps: true })
export class Cart extends Model<Cart> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'active' })
  declare status: string; // 'active', 'confirmed', etc.

  @HasMany(() => CartItem)
  declare items: CartItem[];
}