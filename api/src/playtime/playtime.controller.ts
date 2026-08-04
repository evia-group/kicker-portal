import { Controller, Get, UseGuards } from '@nestjs/common';
import { EntraAuthGuard } from '../auth/entra-auth.guard';
import { PlaytimeService } from './playtime.service';

@Controller('playtime')
@UseGuards(EntraAuthGuard)
export class PlaytimeController {
  constructor(private readonly playtimeService: PlaytimeService) {}

  @Get()
  findAll() {
    return this.playtimeService.findAll();
  }
}
