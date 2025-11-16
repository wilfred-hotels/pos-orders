import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { CatalogProduct } from './catalog-product.entity';
import { Hotel } from './hotel.entity';
import { Product } from './product.entity';

@Table({ tableName: 'catalog_product_sources', timestamps: true })
export class CatalogProductSource extends Model<CatalogProductSource> {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @ForeignKey(() => CatalogProduct)
  @Column({ type: DataType.UUID, allowNull: false })
  declare catalogProductId: string;

  @ForeignKey(() => Hotel)
  @Column({ type: DataType.UUID, allowNull: true })
  declare hotelId?: string;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID, allowNull: true })
  declare productId?: string;

  @Column({ type: DataType.BIGINT, allowNull: true })
  declare basePriceCents?: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare enabled: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 10 })
  declare priority: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastSyncAt?: Date;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare constraints?: any;
}
