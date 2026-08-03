import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { KickerApiKeyGuard } from './kicker-api-key.guard';
import { KickerService } from './kicker.service';
import { KickerStatusDto } from './dto/kicker-status.dto';

@Controller('kicker')
export class KickerController {
  constructor(private readonly kickerService: KickerService) {}

  @Post('status')
  @UseGuards(KickerApiKeyGuard)
  updateStatus(@Body() dto: KickerStatusDto) {
    return this.kickerService.updateStatus(dto);
  }
}
