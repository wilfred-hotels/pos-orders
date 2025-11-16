import { IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'alice' })
  @IsString()
  @ApiProperty({ example: 'admin@example.com', description: 'Username or email of the user' })
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @ApiProperty({ example: 'P@ssw0rd!', description: 'User password' })
  password: string;
  
  // hotelId should be provided to disambiguate users with same username across hotels
  @ApiPropertyOptional({ example: 'hotel-uuid' })
  @IsString()
  hotelId?: string;
}
