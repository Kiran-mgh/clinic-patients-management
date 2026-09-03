import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('public-live')
  async getPublicLiveQueue() {
    return this.queueService.getPublicLiveQueue();
  }

  @Get('dashboard')
  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async getDashboardMetrics() {
    return this.queueService.getDashboardMetrics();
  }

  @Get('today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async getTodayQueue() {
    return this.queueService.getTodayQueue();
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async getReports(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.queueService.getReports(startDate, endDate);
  }

  @Post('call-next')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async callNext(@Req() req: any, @Body('serviceType') serviceType: string) {
    return this.queueService.callNext(req.user.id, serviceType);
  }

  @Patch('tokens/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async updateTokenStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
    @Body('paymentStatus') paymentStatus?: string,
    @Body('paymentNotes') paymentNotes?: string,
  ) {
    return this.queueService.updateTokenStatus(req.user.id, id, status, notes, paymentStatus, paymentNotes);
  }

  @Patch('tokens/:id/payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async updateTokenPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: string,
    @Body('paymentNotes') paymentNotes?: string,
  ) {
    return this.queueService.updateTokenPayment(req.user.id, id, paymentStatus, paymentNotes);
  }
}
