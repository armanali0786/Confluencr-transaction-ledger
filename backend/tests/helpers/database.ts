import { prisma } from '@db/prisma';

/**
 * Empties all ledger tables between tests. TRUNCATE is deliberately not blocked by the
 * immutability triggers, so it stays available for test and admin resets only.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRaw`TRUNCATE TABLE "transactions", "transfers", "accounts" CASCADE`;
}
