import { execSync } from 'node:child_process';

import dotenv from 'dotenv';

/** Brings the test database schema up to date once, before any integration suite runs. */
export default function globalSetup(): void {
  dotenv.config({ quiet: true });

  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error('TEST_DATABASE_URL must be set to run integration tests');
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: 'pipe',
  });
}
