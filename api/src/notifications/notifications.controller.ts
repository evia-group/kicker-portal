import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EntraAuthGuard } from '../auth/entra-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/request-user.interface';
import { NotificationsService } from './notifications.service';
import {
  CreatePushSubscriptionDto,
  DeletePushSubscriptionDto,
  UpdatePreferencesDto,
} from './dto/push.dto';

@Controller('push')
@UseGuards(EntraAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('subscriptions')
  subscribe(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreatePushSubscriptionDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.notifications.subscribe(user.id, dto, userAgent);
  }

  @Delete('subscriptions')
  unsubscribe(
    @CurrentUser() user: RequestUser,
    @Body() dto: DeletePushSubscriptionDto,
  ) {
    return this.notifications.unsubscribe(user.id, dto.endpoint);
  }

  @Get('preferences')
  getPreferences(@CurrentUser() user: RequestUser) {
    return this.notifications.getPreferences(user.id);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notifications.updatePreferences(user.id, dto);
  }
}
