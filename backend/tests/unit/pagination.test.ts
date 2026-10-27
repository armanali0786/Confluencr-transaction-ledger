import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';
import {
  buildPaginationMeta,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_LIMIT,
  parsePagination,
} from '@shared/utils/pagination';

function captureError(fn: () => unknown): AppError {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return error;
  }
  throw new Error('expected an AppError to be thrown');
}

describe('parsePagination', () => {
  it('applies defaults when no parameters are given', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE, skip: 0 });
  });

  it('parses query-string values and computes the offset', () => {
    expect(parsePagination({ page: '3', limit: '25' })).toEqual({ page: 3, limit: 25, skip: 50 });
  });

  it('accepts the maximum limit', () => {
    expect(parsePagination({ limit: String(MAX_PAGE_LIMIT) }).limit).toBe(MAX_PAGE_LIMIT);
  });

  it.each([
    [{ page: '0' }, 'page'],
    [{ page: '-1' }, 'page'],
    [{ page: '1.5' }, 'page'],
    [{ page: 'abc' }, 'page'],
    [{ limit: '0' }, 'limit'],
    [{ limit: String(MAX_PAGE_LIMIT + 1) }, 'limit'],
    [{ limit: '2.5' }, 'limit'],
    [{ limit: ['10', '20'] }, 'limit'],
  ])('rejects %p with INVALID_PAGINATION on %s', (query, field) => {
    const error = captureError(() => parsePagination(query));

    expect(error.code).toBe(ErrorCode.INVALID_PAGINATION);
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual([{ field, message: expect.any(String) }]);
  });
});

describe('buildPaginationMeta', () => {
  it('builds snake_case meta with the total page count', () => {
    expect(buildPaginationMeta({ page: 2, limit: 10, skip: 10 }, 25)).toEqual({
      current_page: 2,
      page_size: 10,
      total_records: 25,
      total_pages: 3,
    });
  });

  it('reports zero pages for an empty collection', () => {
    expect(buildPaginationMeta({ page: 1, limit: 10, skip: 0 }, 0).total_pages).toBe(0);
  });
});
