import { Column, DataType, Model, Table, HasMany } from 'sequelize-typescript';
import { User } from '../auth/user.entity';
import { Product } from './product.entity';

@Table({ tableName: 'hotels', timestamps: false })
export class Hotel extends Model<Hotel> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare address?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare city?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare country?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare phone?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare openingTime?: string; // e.g. '08:00'

  @Column({ type: DataType.STRING, allowNull: true })
  declare closingTime?: string; // e.g. '22:00'

  @Column({ type: DataType.STRING, allowNull: true })
  declare imageUrl?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description?: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare workersCount: number;

  @HasMany(() => User)
  declare users: User[];

  @HasMany(() => Product)
  declare products: Product[];
}
