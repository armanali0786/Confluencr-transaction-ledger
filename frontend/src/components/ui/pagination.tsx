import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { PaginationMeta } from '@/types/api';

import { Button } from './button';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

export function Pagination({ meta, onPageChange, isFetching = false }: PaginationProps) {
  const { current_page: page, total_pages: totalPages, total_records: total, page_size } = meta;
  const firstItem = total === 0 ? 0 : (page - 1) * page_size + 1;
  const lastItem = Math.min(page * page_size, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t border-hairline px-4 py-3 sm:px-6"
    >
      <p className="money text-caption text-ink-mute">
        {total === 0 ? (
          'No results'
        ) : (
          <>
            Showing <span className="text-ink">{firstItem}</span>–
            <span className="text-ink">{lastItem}</span> of{' '}
            <span className="text-ink">{total}</span>
          </>
        )}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isFetching}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isFetching}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
