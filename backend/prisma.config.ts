import path from 'node:path';

import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// A Prisma config file disables Prisma's own .env loading, so load it explicitly.
dotenv.config({ quiet: true });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
});
