import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export type CrmFixtureUser = {
  id: number;
  email: string | null;
  role_id: number | null;
  role?: {
    name: string | null;
  } | null;
};

export async function getAccessTokenForUser(
  app: INestApplication,
  user: CrmFixtureUser,
): Promise<string> {
  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);
  const roleName = user.role?.name ?? null;

  return jwtService.signAsync(
    {
      type: 'ACCESS',
      typeToken: 'ACCESS_TOKEN',
      user: {
        id: user.id,
        email: user.email ?? undefined,
        roleId: user.role_id ?? undefined,
        roleName: roleName ?? undefined,
        currentParentUserId: null,
        isBlock: false,
        isActive: true,
      },
    },
    {
      expiresIn: '1h',
      secret:
        configService.get<string>('JWT_ACCESS_SECRET') ??
        'crm-e2e-access-secret',
    },
  );
}

export const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});
