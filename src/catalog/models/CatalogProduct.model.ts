import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'catalog_products',
  timestamps: true,
})
export class CatalogProduct extends Model {
  @ApiProperty({ description: 'The unique identifier for the product' })
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ApiProperty({
    description: 'The name of the product',
    example: 'Organic Coffee Beans',
  })
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the product',
    example: 'organic-coffee-beans',
  })
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare slug: string;

  @ApiProperty({
    description: 'Detailed description of the product',
    example: 'Premium organic coffee beans from Ethiopian highlands',
  })
  @Column({ type: DataType.TEXT, allowNull: true })
  declare description?: string;

  // Simplified pricing: keep only initialPriceCents and finalPriceCents
  @ApiProperty({
    description: 'Initial price of the product (in cents) when first added to catalog',
    example: 2999,
    required: false,
  })
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare initialPriceCents?: number;

  @ApiProperty({
    description: 'Final price of the product (in cents) to be used for orders',
    example: 2999,
    required: false,
  })
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare finalPriceCents?: number;

  @ApiProperty({
    description: 'Current stock quantity',
    example: 100
  })
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare stock: number;

  @ApiProperty({
    description: 'Name code (previously SKU) - unique product identifier',
    example: 'COFFEE-001'
  })
  @Column({ type: DataType.STRING, allowNull: true, unique: true })
  declare nameCode?: string;

  @ApiProperty({
    description: 'Whether the product is visible in the catalog',
    example: true
  })
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isVisible: boolean;

  @ApiProperty({
    description: 'Array of image URLs for the product',
    example: ['https://example.com/coffee-1.jpg', 'https://example.com/coffee-2.jpg']
  })
  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  declare images?: string[];

  @ApiProperty({
    description: 'Product categories',
    example: ['beverages', 'coffee', 'organic']
  })
  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true, defaultValue: [] })
  declare categories: string[];

  @ApiProperty({
    description: 'Featured product flag',
    example: false
  })
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isFeatured: boolean;

  // Costs removed from catalog model per request; keep only initial & final prices

  @ApiProperty({
    description: 'Average product rating (0.0 - 5.0)',
    example: 4.5,
    required: false,
  })
  @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
  declare rating?: number;

  @ApiProperty({
    description: 'Brand name',
    example: 'Organic Farms Co.'
  })
  @Column({ type: DataType.STRING, allowNull: true })
  declare brand?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-07T12:00:00Z'
  })
  @Column({
    type: DataType.DATE,
  })
  declare createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-11-07T12:00:00Z'
  })
  @Column({
    type: DataType.DATE,
  })
  declare updatedAt: Date;
}