jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { CRM_SYNC_ELIGIBLE_ROLE_ID } from '../domain/crm-sync.constants';
import { CrmSyncEligibilityService } from './crm-sync-eligibility.service';

describe('CrmSyncEligibilityService', () => {
  let service: CrmSyncEligibilityService;
  const findUnique = jest.fn();
  const prisma = { user: { findUnique } };

  beforeEach(async () => {
    findUnique.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmSyncEligibilityService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CrmSyncEligibilityService);
  });

  it('Case 5 / Case 1: wrong role → not syncable', async () => {
    findUnique.mockResolvedValue({
      id: 99,
      email: 'a@b.co',
      username: 'u',
      role_id: CRM_SYNC_ELIGIBLE_ROLE_ID - 1,
      deleted_at: null,
      is_active: true,
      is_block: false,
    });
    await expect(service.getEligibleSellerUser(99)).resolves.toBeNull();
  });

  it('Case 5: inactive → null', async () => {
    findUnique.mockResolvedValue({
      id: 1,
      email: null,
      username: null,
      role_id: CRM_SYNC_ELIGIBLE_ROLE_ID,
      deleted_at: null,
      is_active: false,
      is_block: false,
    });
    await expect(service.getEligibleSellerUser(1)).resolves.toBeNull();
  });

  it('role 6, active, not blocked, not deleted → syncable subset', async () => {
    findUnique.mockResolvedValue({
      id: 7,
      email: 'e',
      username: 'n',
      role_id: CRM_SYNC_ELIGIBLE_ROLE_ID,
      deleted_at: null,
      is_active: true,
      is_block: false,
    });
    await expect(service.getEligibleSellerUser(7)).resolves.toEqual({
      id: 7,
      email: 'e',
      username: 'n',
    });
  });
});
