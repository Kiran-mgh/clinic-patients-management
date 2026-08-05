import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { OtpSession } from '../entities/otp-session.entity';
import { QueueGateway } from '../queue/queue.gateway';

describe('PatientsService', () => {
  let service: PatientsService;

  const mockPatientRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOtpSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockQueueGateway = {
    emitQueueUpdate: jest.fn(),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue({ delete: jest.fn() }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useValue: mockPatientRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepository },
        { provide: getRepositoryToken(OtpSession), useValue: mockOtpSessionRepository },
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: QueueGateway, useValue: mockQueueGateway },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
