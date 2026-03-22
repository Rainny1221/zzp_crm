// Data returned from auth repository — pure TS type, no Prisma dependency
export interface AuthUserData {
  id: number;
  email: string;
  isActive: boolean;
  roles: string[];
}

export const I_AUTH_REPOSITORY = Symbol('I_AUTH_REPOSITORY');

export interface IAuthRepository {
  upsertOAuthUser(email: string): Promise<AuthUserData>;
  findUserWithRolesById(id: number): Promise<AuthUserData | null>;
}
