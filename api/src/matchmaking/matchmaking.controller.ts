import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EntraAuthGuard } from '../auth/entra-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/request-user.interface';
import { MatchmakingService } from './matchmaking.service';
import { JoinQueueDto, RespondProposalDto } from './dto/join-queue.dto';

@Controller('matchmaking')
@UseGuards(EntraAuthGuard)
export class MatchmakingController {
  constructor(private readonly matchmaking: MatchmakingService) {}

  /** Wartende, optional auf eine Spielart eingeschraenkt. */
  @Get('queue')
  list(@Query('gameType') gameType?: string) {
    return this.matchmaking.list(gameType);
  }

  @Post('queue')
  join(@CurrentUser() user: RequestUser, @Body() dto: JoinQueueDto) {
    return this.matchmaking.join(user.id, dto.gameTypeKey, dto.teamSize);
  }

  /**
   * Verlaesst die Warteschlange. Ohne `gameType` alle, mit `gameType` nur diese
   * eine, damit man Dart weiterlaufen lassen kann, wenn man nur Kicker aufgibt.
   */
  @Delete('queue/me')
  leave(
    @CurrentUser() user: RequestUser,
    @Query('gameType') gameType?: string,
  ) {
    return this.matchmaking.leave(user.id, gameType);
  }

  @Post('proposals/:id/respond')
  respond(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondProposalDto,
  ) {
    return this.matchmaking.respond(id, user.id, dto.response);
  }
}
