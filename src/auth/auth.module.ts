import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [UsersService, AuthService],
  controllers: [AuthController],
  exports: [UsersService, AuthService],
})
export class AuthModule {}
