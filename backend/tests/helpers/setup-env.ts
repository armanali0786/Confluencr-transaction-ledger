import dotenv from 'dotenv';

dotenv.config({ quiet: true });

process.env.NODE_ENV = 'test';

// Tests must never touch the development database.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
