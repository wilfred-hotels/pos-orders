import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterProductsDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'coffee'
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by brand',
    example: 'Organic Farms Co.'
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Search term for name and description',
    example: 'organic coffee'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by featured status',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true)
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by specific categories',
    example: ['beverages', 'coffee']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'How to match categories: "any" = products that match any of the categories, "all" = products that include all provided categories',
    example: 'any'
  })
  @IsOptional()
  @IsString()
  @IsIn(['any', 'all'])
  categoriesMode?: 'any' | 'all';
}