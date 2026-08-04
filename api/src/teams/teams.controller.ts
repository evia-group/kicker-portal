import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { EntraAuthGuard } from '../auth/entra-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(EntraAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  delete(@Param('id') id: string) {
    return this.teamsService.delete(id);
  }
}
