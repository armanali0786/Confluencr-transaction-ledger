import { z } from 'zod';

import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';
import { formatZodError } from '@shared/errors/format-zod-error';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_LIMIT = 100;

const paginationQuerySchema = z.object({
  page: z.coerce
    .number({ error: 'page must be a number' })
    .int('page must be an integer')
    .min(1, 'page must be at least 1')
    .default(DEFAULT_PAGE),
  limit: z.coerce
    .number({ error: 'limit must be a number' })
    .int('limit must be an integer')
    .min(1, 'limit must be at least 1')
    .max(MAX_PAGE_LIMIT, `limit must not exceed ${MAX_PAGE_LIMIT}`)
    .default(DEFAULT_PAGE_SIZE),
});

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  current_page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export function parsePagination(query: unknown): Pagination {
  const result = paginationQuerySchema.safeParse(query);

  if (!result.success) {
    throw new AppError(
      ErrorCode.INVALID_PAGINATION,
      'Invalid pagination parameters',
      formatZodError(result.error),
    );
  }

  const { page, limit } = result.data;
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(
  { page, limit }: Pagination,
  totalRecords: number,
): PaginationMeta {
  return {
    current_page: page,
    page_size: limit,
    total_records: totalRecords,
    total_pages: Math.ceil(totalRecords / limit),
  };
}
