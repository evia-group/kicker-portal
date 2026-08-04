import { Injectable } from '@nestjs/common';
import { PlaytimeService } from '../playtime/playtime.service';
import { KickerGateway } from './kicker.gateway';
import { KickerStatusDto } from './dto/kicker-status.dto';
import { MatchmakingService } from '../matchmaking/matchmaking.service';

/** Der physische Tisch ist ein Kickertisch. */
const KICKER_GAME_TYPE_KEY = 'kicker';

@Injectable()
export class KickerService {
  constructor(
    private readonly playtimeService: PlaytimeService,
    private readonly gateway: KickerGateway,
    private readonly matchmaking: MatchmakingService,
  ) {}

  async updateStatus(dto: KickerStatusDto) {
    if (dto.endTime) {
      await this.playtimeService.create(
        new Date(dto.startTime * 1000),
        new Date(dto.endTime * 1000),
      );
      // Eine beendete Sitzung heisst: der Tisch ist frei. Das ist der
      // natuerliche Anlass, die Wartenden zu erinnern, und er kommt vom Tisch
      // selbst statt aus einer Vermutung im Frontend.
      await this.matchmaking.announceTableFree(KICKER_GAME_TYPE_KEY);
    }
    this.gateway.broadcastStatus(dto);
  }
}
