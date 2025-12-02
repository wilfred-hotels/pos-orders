import { IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CartItemDto {
  @ApiProperty({ example: 'uuid-of-product', description: 'Product id (UUID)' })
  @IsInt()
  productId: string;

  @ApiProperty({ example: 1, description: 'Quantity' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class AddItemsDto {
  @ApiProperty({ type: [CartItemDto], description: 'Items to add to cart' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @ApiProperty({ example: 'guest-or-user-id', description: 'User or guest id that owns the cart' })
  userId?: string;
}
