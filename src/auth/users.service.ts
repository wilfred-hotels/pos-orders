import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_ROLE, AVAILABLE_ROLES, Role } from './roles.const';

@Injectable()
export class UsersService {
  async findByUsername(username: string, hotelId?: string) {
    const where: any = { username };
    if (hotelId) where.hotelId = hotelId;
    return User.findOne({ where });
  }

  async create(
    username: string,
    password: string,
    role: Role = DEFAULT_ROLE,
    hotelId?: string,
    options?: { transaction?: any },
  ): Promise<any> {
    const hash = (await bcrypt.hash(password, 10)) as unknown as string;
    // Ensure role is one of the allowed roles; fallback to default
    const assignedRole = AVAILABLE_ROLES.includes(role) ? role : DEFAULT_ROLE;
    const createOptions: any = {};
    if (options?.transaction) createOptions.transaction = options.transaction;
    return User.create({ username, password: hash, role: assignedRole, hotelId } as any, createOptions);
  }
}
