// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:  [JwtModule],
  providers: [UsersService, UsersResolver],
})
export class UsersModule {}
