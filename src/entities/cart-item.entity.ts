import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Cart } from './cart.entity';
import { Product } from './product.entity';

@Table({ tableName: 'cart_items', timestamps: false })
export class CartItem extends Model<CartItem> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => Cart)
  @Column({ type: DataType.UUID, allowNull: false })
  declare cartId: string;

  @BelongsTo(() => Cart)
  declare cart: Cart;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: false })
  declare productId: string;

  @BelongsTo(() => Product)
  declare product: Product;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare quantity: number;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'pending' })
  declare status: string; // 'pending', 'confirmed', etc.
}