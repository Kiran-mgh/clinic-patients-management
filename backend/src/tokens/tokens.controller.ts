import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generateToken(@Req() req: any, @Body('serviceType') serviceType: string) {
    return this.tokensService.generateToken(req.user.id, serviceType);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  async getTodayToken(@Req() req: any) {
    return this.tokensService.getTodayToken(req.user.id);
  }

  @Get('queue-status')
  async getQueueStatus() {
    return this.tokensService.getQueueStatus();
  }
}
