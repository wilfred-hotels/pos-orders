import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumberString
} from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  providerTransactionId?: string;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  raw?: any;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsUUID()
  cartId?: string;

  @IsOptional()
  @IsString()
  initiatedCheckoutRequestId?: string;

  @IsOptional()
  @IsString()
  initiatedMerchantRequestId?: string;
}
