import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('tokens')
  async getTokenSettings() {
    return this.settingsService.getTokenSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  @Put('tokens')
  async updateTokenSettings(
    @Req() req: any,
    @Body() body: { startTime?: string; endTime?: string; enabled?: boolean },
  ) {
    return this.settingsService.updateTokenSettings(req.user.id, body);
  }
}
