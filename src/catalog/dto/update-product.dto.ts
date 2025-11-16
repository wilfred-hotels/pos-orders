import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsArray, IsBoolean, IsUrl } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateCatalogProductDto {
  @ApiPropertyOptional({
    description: 'Name of the product',
    example: 'Organic Coffee Beans'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the product',
    example: 'Premium organic coffee beans from Ethiopian highlands'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Initial price in cents (use initialPriceCents instead of price)',
    example: 2999
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  initialPriceCents?: number;

  @ApiPropertyOptional({
    description: 'Stock quantity',
    example: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    description: 'Stock Keeping Unit (SKU)',
    example: 'COFFEE-001'
  })
  @IsOptional()
  @IsString()
  nameCode?: string;

  @ApiPropertyOptional({
    description: 'Product visibility in catalog',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true)
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Array of product image URLs',
    example: ['https://example.com/coffee-1.jpg']
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Product categories',
    example: ['beverages', 'coffee', 'organic']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Featured product flag',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true)
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Organic Farms Co.'
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Final price in cents (to be used for orders)', example: 2999 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  finalPriceCents?: number;

  @ApiPropertyOptional({ description: 'Average rating (0.0 - 5.0)', example: 4.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;
}