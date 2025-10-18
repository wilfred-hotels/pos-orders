import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Hotel } from '../entities/hotel.entity';

@Table({ tableName: 'users', timestamps: false })
export class User extends Model<User> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare username: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'customer' })
  declare role: string; // e.g., customer, cashier, manager, admin

  @ForeignKey(() => Hotel)
  @Column({ type: DataType.UUID, allowNull: true })
  declare hotelId?: string;

  @BelongsTo(() => Hotel)
  declare hotel?: Hotel;
}
