import { Injectable } from '@nestjs/common';
import { PlaytimeService } from '../playtime/playtime.service';
import { KickerGateway } from './kicker.gateway';
import { KickerStatusDto } from './dto/kicker-status.dto';

@Injectable()
export class KickerService {
  constructor(
    private readonly playtimeService: PlaytimeService,
    private readonly gateway: KickerGateway,
  ) {}

  async updateStatus(dto: KickerStatusDto) {
    if (dto.endTime) {
      await this.playtimeService.create(
        new Date(dto.startTime * 1000),
        new Date(dto.endTime * 1000),
      );
    }
    this.gateway.broadcastStatus(dto);
  }
}
