import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Joins class names; on Tailwind conflicts (e.g. text-left vs text-right) the later one wins. */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
