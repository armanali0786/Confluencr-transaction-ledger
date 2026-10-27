import type { ApiSuccess, Page } from '@/types/api';

import { ApiError, UNKNOWN_ERROR } from './errors';

export function toPage<TItem>(response: ApiSuccess<TItem[]>): Page<TItem> {
  if (!response.meta) {
    throw new ApiError(null, UNKNOWN_ERROR, 'Paginated response is missing pagination meta');
  }
  return { items: response.data, meta: response.meta };
}
