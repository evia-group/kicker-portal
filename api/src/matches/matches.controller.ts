import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EntraAuthGuard } from '../auth/entra-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';

@Controller('matches')
@UseGuards(EntraAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  /** `?gameType=kicker|darts` filtert auf eine Spielart. Ohne Parameter kommen
   *  alle, damit bestehende Clients unveraendert funktionieren. */
  @Get()
  findAll(@Query('gameType') gameType?: string) {
    return this.matchesService.findAll(gameType);
  }

  @Post()
  create(@Body() dto: CreateMatchDto) {
    return this.matchesService.create(dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  delete(@Param('id') id: string) {
    return this.matchesService.delete(id);
  }
}
