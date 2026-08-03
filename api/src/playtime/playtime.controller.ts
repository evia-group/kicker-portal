import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { PlaytimeService } from './playtime.service';

@Controller('playtime')
@UseGuards(FirebaseAuthGuard)
export class PlaytimeController {
  constructor(private readonly playtimeService: PlaytimeService) {}

  @Get()
  findAll() {
    return this.playtimeService.findAll();
  }
}
