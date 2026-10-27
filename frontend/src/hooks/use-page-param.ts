import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const PAGE_PARAM = 'page';

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** Keeps the current page in the URL so it survives reloads and back/forward navigation. */
export function usePageParam(): [number, (page: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get(PAGE_PARAM));

  const setPage = useCallback(
    (nextPage: number) => {
      setSearchParams((params) => {
        if (nextPage <= 1) params.delete(PAGE_PARAM);
        else params.set(PAGE_PARAM, String(nextPage));
        return params;
      });
    },
    [setSearchParams],
  );

  return [page, setPage];
}
