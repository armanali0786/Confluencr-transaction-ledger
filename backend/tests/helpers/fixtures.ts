import { prisma } from '@db/prisma';

export const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

export function createTestAccount(name = 'Test Account', balance = 0n) {
  return prisma.account.create({ data: { name, balance } });
}
