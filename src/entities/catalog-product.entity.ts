import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'catalog_products', timestamps: true })
export class CatalogProduct extends Model<CatalogProduct> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare slug: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare imageUrl?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare category?: string;

  @Column({ type: DataType.BIGINT, allowNull: true })
  declare initialPriceCents?: number;

  @Column({ type: DataType.BIGINT, allowNull: true })
  declare finalPriceCents?: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare active: boolean;
}
