import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'doctor')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('dashboard')
  @Get('overview')
  async getDashboardMetrics() {
    return this.queueService.getDashboardMetrics();
  }

  @Get('today')
  async getTodayQueue() {
    return this.queueService.getTodayQueue();
  }

  @Get('reports')
  async getReports(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.queueService.getReports(startDate, endDate);
  }

  @Post('call-next')
  async callNext(@Req() req: any, @Body('serviceType') serviceType: string) {
    return this.queueService.callNext(req.user.id, serviceType);
  }

  @Patch('tokens/:id/status')
  async updateTokenStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.queueService.updateTokenStatus(req.user.id, id, status, notes);
  }
}
