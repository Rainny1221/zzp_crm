export const TokenType = {
  REFRESH: 'REFRESH',
  ACCESS: 'ACCESS',
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];
