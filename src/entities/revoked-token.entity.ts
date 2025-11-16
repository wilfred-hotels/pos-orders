import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'revoked_tokens', timestamps: true })
export class RevokedToken extends Model<RevokedToken> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  declare token: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare expiresAt?: Date;

  @Column({ type: DataType.UUID, allowNull: true })
  declare userId?: string;
}
