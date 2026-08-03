import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { EntraAuthGuard } from '../auth/entra-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/request-user.interface';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(EntraAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  getCurrentUser(@CurrentUser() user: RequestUser) {
    return user;
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
