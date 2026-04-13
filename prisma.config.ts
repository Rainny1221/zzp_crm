import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv();
loadEnv({ path: '.env.prisma', override: true });

export default defineConfig({
  // Multi-file schema root. Prisma loads all .prisma files under this folder.
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // DATABASE_URL is the default target.
    // PRISMA_DATABASE_URL can temporarily override Prisma CLI to introspect
    // or deploy against a different database when explicitly needed.
    url: process.env.PRISMA_DATABASE_URL ?? process.env.DATABASE_URL,
  },
});
