import type { Prisma, PrismaClient } from '@prisma/client';

/** Lets repositories run either standalone or inside an interactive `prisma.$transaction`. */
export type DbClient = PrismaClient | Prisma.TransactionClient;
