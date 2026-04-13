import { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  sub: number;
  email?: string;
  roleId?: number;
  roleName?: string;
  currentParentUserId: number | null;
  isBlock: boolean;
  isActive: boolean;
  tokenType?: string;
  iat?: number;
  exp?: number;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
