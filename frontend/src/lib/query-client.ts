import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/api/errors';

const MAX_QUERY_RETRIES = 2;
const STALE_TIME_MS = 10_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      // A 4xx will not fix itself on retry; only retry network and server errors.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.isClientError) && failureCount < MAX_QUERY_RETRIES,
    },
    mutations: {
      retry: false,
    },
  },
});
