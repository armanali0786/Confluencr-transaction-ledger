import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Custom type and shadow tokens from index.css. Without registering them, tailwind-merge
// reads `text-body-md` as a colour and drops it when combined with `text-ink`.
const TYPE_SCALE = [
  'display-xxl',
  'display-xl',
  'display-lg',
  'display-md',
  'heading-lg',
  'heading-md',
  'heading-sm',
  'body-lg',
  'body-md',
  'body-tabular',
  'button-md',
  'button-sm',
  'caption',
  'micro',
  'micro-cap',
];

const twMerge = extendTailwindMerge({
  extend: { theme: { text: TYPE_SCALE, shadow: ['level-1', 'level-2'] } },
});

/** Joins class names; on Tailwind conflicts (e.g. text-left vs text-right) the later one wins. */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
