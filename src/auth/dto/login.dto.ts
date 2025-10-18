import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
  
  // hotelId should be provided to disambiguate users with same username across hotels
  @IsString()
  hotelId?: string;
}
