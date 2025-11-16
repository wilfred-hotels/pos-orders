import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogCheckoutDto {
  @ApiProperty({ description: 'Catalog product id', example: 'uuid-catalog-product' })
  @IsString()
  catalogProductId: string;

  @ApiPropertyOptional({ description: 'Number of units', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Contact information for guest', type: 'object', additionalProperties: true })
  @IsOptional()
  contact?: any;

  @ApiPropertyOptional({ description: 'Optional user id (if authenticated)' })
  @IsOptional()
  @IsString()
  userId?: string;
}
