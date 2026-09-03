import { Controller, Post, Get, Body, Req, UseGuards, Headers } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generateToken(
    @Req() req: any,
    @Body('serviceType') serviceType: string,
    @Headers('x-push-token') pushToken?: string,
  ) {
    return this.tokensService.generateToken(req.user.id, serviceType, pushToken);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  async getTodayToken(
    @Req() req: any,
    @Headers('x-push-token') pushToken?: string,
  ) {
    return this.tokensService.getTodayToken(req.user.id, pushToken);
  }

  @Get('queue-status')
  async getQueueStatus() {
    return this.tokensService.getQueueStatus();
  }

  @Get('my-history')
  @UseGuards(JwtAuthGuard)
  async getMyHistory(
    @Req() req: any,
    @Headers('x-push-token') pushToken?: string,
  ) {
    return this.tokensService.getMyHistory(req.user.id, pushToken);
  }
}
