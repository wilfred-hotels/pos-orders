import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number | string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  stock?: number | string;

  @IsOptional()
  @IsString()
  hotelId?: string;
}
