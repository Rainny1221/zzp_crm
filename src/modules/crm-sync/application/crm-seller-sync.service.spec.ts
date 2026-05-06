jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from 'src/logger/app-logger.service';
import { CrmSellerSyncService } from './crm-seller-sync.service';
import { CrmSyncEligibilityService } from './crm-sync-eligibility.service';
import { TiktokShopAuthorizationReaderService } from './tiktok-shop-authorization-reader.service';
import { I_CRM_SYNC_WRITER_REPOSITORY } from '../domain/repositories/i-crm-sync-writer.repository';

describe('CrmSellerSyncService', () => {
  let service: CrmSellerSyncService;
  const getEligibleSellerUser = jest.fn();
  const getLatestValidAuthorization = jest.fn();
  const syncSellerSnapshot = jest.fn();

  beforeEach(async () => {
    getEligibleSellerUser.mockReset();
    getLatestValidAuthorization.mockReset();
    syncSellerSnapshot.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmSellerSyncService,
        {
          provide: CrmSyncEligibilityService,
          useValue: { getEligibleSellerUser },
        },
        {
          provide: TiktokShopAuthorizationReaderService,
          useValue: { getLatestValidAuthorization },
        },
        {
          provide: I_CRM_SYNC_WRITER_REPOSITORY,
          useValue: { syncSellerSnapshot },
        },
        {
          provide: AppLoggerService,
          useValue: { debug: jest.fn(), info: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(CrmSellerSyncService);
  });

  it('ineligible user → skip, writer not called', async () => {
    getEligibleSellerUser.mockResolvedValue(null);

    await expect(service.syncUser(5)).resolves.toEqual({ skipped: true });
    expect(syncSellerSnapshot).not.toHaveBeenCalled();
    expect(getLatestValidAuthorization).not.toHaveBeenCalled();
  });

  it('eligible user but no valid auth → skip, writer not called', async () => {
    getEligibleSellerUser.mockResolvedValue({
      id: 8,
      email: 's@x.co',
      username: 'seller',
    });
    getLatestValidAuthorization.mockResolvedValue(null);

    await expect(service.syncUser(8)).resolves.toEqual({ skipped: true });
    expect(syncSellerSnapshot).not.toHaveBeenCalled();
  });

  it('eligible + valid auth → writer with isAuthorized true and authorizedAt from auth', async () => {
    const authorizedAt = new Date('2026-02-01T00:00:00.000Z');
    getEligibleSellerUser.mockResolvedValue({
      id: 8,
      email: 's@x.co',
      username: 'seller',
    });
    getLatestValidAuthorization.mockResolvedValue({
      authorizationId: 100,
      authorizedAt,
    });
    syncSellerSnapshot.mockResolvedValue({
      customerProfileId: 1,
      dealId: 2,
      pipelineRecordId: 3,
    });

    await expect(service.syncUser(8)).resolves.toEqual({
      skipped: false,
      result: {
        customerProfileId: 1,
        dealId: 2,
        pipelineRecordId: 3,
      },
    });

    expect(syncSellerSnapshot).toHaveBeenCalledWith({
      userId: 8,
      email: 's@x.co',
      username: 'seller',
      isAuthorized: true,
      authorizedAt,
    });
  });
});
