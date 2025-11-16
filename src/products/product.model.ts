import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({
  tableName: 'products',
  timestamps: true,
})
export class Product extends Model {
  @ApiProperty({ description: 'Unique identifier for the product' })
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ApiProperty({ description: 'Name of the product' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @ApiProperty({ description: 'Detailed description of the product' })
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @ApiProperty({ description: 'Price of the product in cents' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  price: number;

  @ApiProperty({ description: 'Current stock quantity' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  stock: number;

  @ApiProperty({ description: 'SKU (Stock Keeping Unit) of the product' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  sku?: string;

  @ApiProperty({ description: 'Whether the product is available for sale' })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive: boolean;

  @ApiProperty({ description: 'Array of image URLs for the product' })
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  images?: string[];

  @ApiProperty({ description: 'Product categories' })
  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  categories: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  @Column({
    type: DataType.DATE,
  })
  declare createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Column({
    type: DataType.DATE,
  })
  declare updatedAt: Date;
}
