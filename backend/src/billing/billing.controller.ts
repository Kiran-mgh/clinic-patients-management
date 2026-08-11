import { Controller, Post, Patch, Delete, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateTreatmentCourseDto } from './dto/create-treatment-course.dto';
import { UpdateTreatmentCourseDto } from './dto/update-treatment-course.dto';
import { RecordCoursePaymentDto } from './dto/record-course-payment.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('patients/:id/ledger')
  @UseGuards(JwtAuthGuard)
  async getPatientLedger(@Param('id') patientId: string) {
    return this.billingService.getPatientLedger(patientId);
  }

  @Post('patients/:id/courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor', 'staff')
  async createTreatmentCourse(
    @Param('id') patientId: string,
    @Body() dto: CreateTreatmentCourseDto,
  ) {
    return this.billingService.createTreatmentCourse(patientId, dto);
  }

  @Patch('courses/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor', 'staff')
  async updateTreatmentCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateTreatmentCourseDto,
  ) {
    return this.billingService.updateTreatmentCourse(courseId, dto);
  }

  @Delete('courses/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async deleteCourse(@Param('courseId') courseId: string) {
    return this.billingService.deleteCourse(courseId);
  }

  @Post('patients/:id/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor', 'staff')
  async recordPayment(
    @Req() req: any,
    @Param('id') patientId: string,
    @Body() dto: RecordCoursePaymentDto,
  ) {
    const recordedBy = req.user?.username || req.user?.name || 'Staff';
    return this.billingService.recordPayment(patientId, dto, recordedBy);
  }

  @Delete('payments/:paymentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor')
  async deletePayment(@Param('paymentId') paymentId: string) {
    return this.billingService.deletePayment(paymentId);
  }

  @Get('reports/collections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor', 'staff')
  async getCollectionsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.billingService.getCollectionsReport(startDate, endDate);
  }

  @Get('reports/clinic-summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'doctor', 'staff')
  async getClinicFinancialSummary() {
    return this.billingService.getClinicFinancialSummary();
  }
}
