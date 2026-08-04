import { Controller, Get, UseGuards } from '@nestjs/common';
import { EntraAuthGuard } from '../auth/entra-auth.guard';
import { GameTypesService } from './game-types.service';

@Controller('game-types')
@UseGuards(EntraAuthGuard)
export class GameTypesController {
  constructor(private readonly gameTypesService: GameTypesService) {}

  @Get()
  findAll() {
    return this.gameTypesService.findAll();
  }
}
