import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind conflict resolution.
 * Required by shadcn/ui components.
 */
export const cn = (...inputs) => twMerge(clsx(inputs));
