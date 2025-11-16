import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuperAdminLoginDto {
  @ApiProperty({
    example: 'superadmin',
    description: 'Username of the super admin'
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'strongP@ssw0rd!',
    description: 'Super admin password'
  })
  @IsString()
  password: string;
}