import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { TreatmentCourse } from '../entities/treatment-course.entity';
import { CoursePayment } from '../entities/course-payment.entity';
import { Patient } from '../entities/patient.entity';
import { CreateTreatmentCourseDto } from './dto/create-treatment-course.dto';
import { UpdateTreatmentCourseDto } from './dto/update-treatment-course.dto';
import { RecordCoursePaymentDto } from './dto/record-course-payment.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(TreatmentCourse)
    private readonly courseRepository: Repository<TreatmentCourse>,
    @InjectRepository(CoursePayment)
    private readonly paymentRepository: Repository<CoursePayment>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  private getIstDateString(): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now);
  }

  async getPatientLedger(patientId: string) {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID "${patientId}" not found`);
    }

    const courses = await this.courseRepository.find({
      where: { patientId },
      relations: ['payments'],
      order: { createdAt: 'DESC' },
    });

    const allPayments = await this.paymentRepository.find({
      where: { patientId },
      order: { paidAt: 'DESC' },
    });

    let totalCoursesFee = 0;
    let totalPaid = 0;

    const formattedCourses = courses.map((c) => {
      const fee = Number(c.totalFee) || 0;
      totalCoursesFee += fee;

      const coursePayments = (c.payments || []).sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
      );

      const coursePaid = coursePayments.reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0,
      );

      return {
        id: c.id,
        title: c.title,
        totalFee: fee,
        status: c.status,
        notes: c.notes,
        startDate: c.startDate,
        completedAt: c.completedAt,
        createdAt: c.createdAt,
        totalPaid: coursePaid,
        balanceDue: Math.max(0, fee - coursePaid),
        isFullyPaid: coursePaid >= fee,
        payments: coursePayments.map((p) => ({
          id: p.id,
          amount: Number(p.amount) || 0,
          paymentMode: p.paymentMode,
          transactionNotes: p.transactionNotes,
          recordedBy: p.recordedBy,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
      };
    });

    totalPaid = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalBalanceDue = Math.max(0, totalCoursesFee - totalPaid);

    const standalonePayments = allPayments
      .filter((p) => !p.courseId)
      .map((p) => ({
        id: p.id,
        amount: Number(p.amount) || 0,
        paymentMode: p.paymentMode,
        transactionNotes: p.transactionNotes,
        recordedBy: p.recordedBy,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      }));

    // Active course summary if any
    const activeCourse = formattedCourses.find((c) => c.status === 'active') || null;

    return {
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        fullName: patient.fullName,
        gender: patient.gender,
        town: patient.town,
      },
      summary: {
        totalCoursesFee,
        totalPaid,
        totalBalanceDue,
        hasActiveCourse: !!activeCourse,
        activeCourseBalance: activeCourse ? activeCourse.balanceDue : 0,
        activeCourseTitle: activeCourse ? activeCourse.title : null,
      },
      courses: formattedCourses,
      standalonePayments,
      allPayments: allPayments.map((p) => ({
        id: p.id,
        courseId: p.courseId,
        amount: Number(p.amount) || 0,
        paymentMode: p.paymentMode,
        transactionNotes: p.transactionNotes,
        recordedBy: p.recordedBy,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
    };
  }

  async createTreatmentCourse(patientId: string, dto: CreateTreatmentCourseDto) {
    const patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID "${patientId}" not found`);
    }

    const course = this.courseRepository.create({
      patientId,
      title: dto.title,
      totalFee: dto.totalFee,
      notes: dto.notes,
      startDate: dto.startDate || this.getIstDateString(),
      status: 'active',
    });

    return await this.courseRepository.save(course);
  }

  async updateTreatmentCourse(courseId: string, dto: UpdateTreatmentCourseDto) {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Treatment course with ID "${courseId}" not found`);
    }

    if (dto.title !== undefined) course.title = dto.title;
    if (dto.totalFee !== undefined) course.totalFee = dto.totalFee;
    if (dto.notes !== undefined) course.notes = dto.notes;
    if (dto.startDate !== undefined) course.startDate = dto.startDate;

    if (dto.status !== undefined) {
      course.status = dto.status;
      if (dto.status === 'completed' && !course.completedAt) {
        course.completedAt = new Date();
      } else if (dto.status === 'active') {
        course.completedAt = null as any;
      }
    }

    return await this.courseRepository.save(course);
  }

  async recordPayment(patientId: string, dto: RecordCoursePaymentDto, recordedBy: string = 'Staff') {
    const patient = await this.patientRepository.findOne({ where: { id: patientId } });
    if (!patient) {
      throw new NotFoundException(`Patient with ID "${patientId}" not found`);
    }

    let course: TreatmentCourse | null = null;
    if (dto.courseId) {
      course = await this.courseRepository.findOne({
        where: { id: dto.courseId, patientId },
      });
      if (!course) {
        throw new BadRequestException(`Treatment course not found for this patient`);
      }
    } else {
      // Auto-attach to active course if patient has only 1 active course
      const activeCourses = await this.courseRepository.find({
        where: { patientId, status: 'active' },
        order: { createdAt: 'DESC' },
      });
      if (activeCourses.length > 0) {
        course = activeCourses[0];
      }
    }

    const payment = this.paymentRepository.create({
      patientId,
      courseId: course ? course.id : undefined,
      amount: dto.amount,
      paymentMode: dto.paymentMode || 'Cash',
      transactionNotes: dto.transactionNotes,
      recordedBy,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Return the updated ledger summary
    return {
      payment: savedPayment,
      ledger: await this.getPatientLedger(patientId),
    };
  }

  async deletePayment(paymentId: string) {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${paymentId}" not found`);
    }
    const patientId = payment.patientId;
    await this.paymentRepository.remove(payment);
    return { message: 'Payment deleted successfully', patientId };
  }

  async deleteCourse(courseId: string) {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException(`Course with ID "${courseId}" not found`);
    }
    const patientId = course.patientId;
    await this.courseRepository.remove(course);
    return { message: 'Course deleted successfully', patientId };
  }

  async getCollectionsReport(startDate?: string, endDate?: string) {
    let query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.patient', 'patient')
      .leftJoinAndSelect('payment.course', 'course')
      .orderBy('payment.paidAt', 'DESC');

    if (startDate && endDate) {
      query = query.where('payment.paidAt >= :start AND payment.paidAt <= :end', {
        start: `${startDate} 00:00:00`,
        end: `${endDate} 23:59:59`,
      });
    } else if (startDate) {
      query = query.where('payment.paidAt >= :start', {
        start: `${startDate} 00:00:00`,
      });
    }

    const payments = await query.getMany();

    let totalCollections = 0;
    const modeBreakdown: Record<string, number> = {
      Cash: 0,
      UPI: 0,
      Card: 0,
      'Net Banking': 0,
      Other: 0,
    };

    const formattedList = payments.map((p) => {
      const amt = Number(p.amount) || 0;
      totalCollections += amt;

      const mode = p.paymentMode || 'Cash';
      modeBreakdown[mode] = (modeBreakdown[mode] || 0) + amt;

      return {
        id: p.id,
        amount: amt,
        paymentMode: p.paymentMode,
        transactionNotes: p.transactionNotes,
        recordedBy: p.recordedBy,
        paidAt: p.paidAt,
        patientId: p.patient?.patientId || 'Unassigned',
        patientName: p.patient?.fullName || 'Unknown',
        patientDbId: p.patientId,
        courseTitle: p.course?.title || 'General / Standalone',
      };
    });

    return {
      totalCollections,
      totalTransactions: payments.length,
      modeBreakdown,
      transactions: formattedList,
    };
  }
}
