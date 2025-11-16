import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GuestCheckoutDto {
  @ApiProperty({ description: 'Cart id containing guest items', example: 'uuid-of-cart' })
  @IsString()
  cartId: string;

  @ApiProperty({ description: 'Guest id returned from POST /guests', example: 'uuid-of-guest' })
  @IsString()
  guestId: string;

  @ApiPropertyOptional({ description: 'Optional contact details for guest (phone/email/address)' })
  @IsOptional()
  contact?: any;
}
