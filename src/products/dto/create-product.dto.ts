import { IsString, IsOptional, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Premium Coffee Beans', description: 'Product name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Freshly roasted Arabica coffee beans', description: 'Product description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1999, description: 'Price in cents (19.99)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100, description: 'Initial stock quantity' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'COFFEE-001', description: 'Stock Keeping Unit' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: ['https://example.com/image1.jpg'], description: 'Product image URLs' })
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: ['beverages', 'coffee'], description: 'Product categories' })
  @IsOptional()
  @IsString({ each: true })
  categories?: string[];
}
