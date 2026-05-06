jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { TiktokShopAuthorizationReaderService } from './tiktok-shop-authorization-reader.service';

describe('TiktokShopAuthorizationReaderService', () => {
  let service: TiktokShopAuthorizationReaderService;
  const findFirst = jest.fn();
  const prisma = { tiktok_shop_authorizations: { findFirst } };

  beforeEach(async () => {
    findFirst.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiktokShopAuthorizationReaderService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TiktokShopAuthorizationReaderService);
  });

  it('no valid row → null (orchestration must not sync)', async () => {
    findFirst.mockResolvedValue(null);
    await expect(service.getLatestValidAuthorization(10)).resolves.toBeNull();
  });

  it('latest valid row by created_at desc', async () => {
    const latest = new Date('2026-03-02T00:00:00.000Z');
    findFirst.mockResolvedValue({ id: 44, created_at: latest });

    await expect(service.getLatestValidAuthorization(10)).resolves.toEqual({
      authorizationId: 44,
      authorizedAt: latest,
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          created_by: 10,
          deleted_at: null,
          OR: [{ is_authorized: true }, { is_authorized: null }],
        }),
        orderBy: { created_at: 'desc' },
      }),
    );
  });

  it('authorizedAt equals row created_at', async () => {
    const createdAt = new Date('2026-01-01T12:34:56.789Z');
    findFirst.mockResolvedValue({ id: 3, created_at: createdAt });
    await expect(service.getLatestValidAuthorization(22)).resolves.toEqual({
      authorizationId: 3,
      authorizedAt: createdAt,
    });
  });
});
