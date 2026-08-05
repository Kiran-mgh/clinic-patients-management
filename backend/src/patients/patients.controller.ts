import { Controller, Post, Put, Delete, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterPatientByStaffDto } from './dto/register-patient-by-staff.dto';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async register(@Req() req: any, @Body() registerPatientDto: RegisterPatientDto) {
    return this.patientsService.register(req.user.id, registerPatientDto);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async createPatientByStaff(@Req() req: any, @Body() registerPatientByStaffDto: RegisterPatientByStaffDto) {
    return this.patientsService.createPatientByStaff(req.user.id, registerPatientByStaffDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.patientsService.getProfile(req.user.id);
  }

  @Post('request-email-otp')
  @UseGuards(JwtAuthGuard)
  async requestEmailOtp(@Body('email') email: string) {
    return this.patientsService.requestEmailOtp(email);
  }

  @Post('verify-email-otp')
  @UseGuards(JwtAuthGuard)
  async verifyEmailOtp(@Body('email') email: string, @Body('otpCode') otpCode: string) {
    return this.patientsService.verifyEmailOtp(email, otpCode);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.patientsService.updateProfile(req.user.id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async deletePatient(@Req() req: any, @Param('id') id: string) {
    return this.patientsService.deletePatient(req.user.id, id);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async getPendingApprovals() {
    return this.patientsService.getPendingApprovals();
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async approvePatient(
    @Req() req: any,
    @Param('id') id: string,
    @Body('patientId') patientId?: string,
  ) {
    return this.patientsService.approvePatient(req.user.id, id, patientId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async searchPatients(@Query('query') query: string) {
    return this.patientsService.searchPatients(query);
  }

  @Get(':id/detail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async getPatientDetail(@Param('id') id: string) {
    return this.patientsService.getPatientDetail(id);
  }
}
