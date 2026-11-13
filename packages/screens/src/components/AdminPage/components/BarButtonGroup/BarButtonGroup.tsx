import { cn } from '@ValenceUI/cn';
import type { BarButtonGroupProps } from './BarButtonGroup.types';

const SEGMENT = [
  '[&_li]:flex [&_li]:rounded-[4px] [&_li]:bg-[var(--surface-hover)] [&_li]:[--surface-hover:var(--surface-active)]',
  '[&>div]:flex [&>div]:items-center [&>div]:rounded-[4px] [&>div]:bg-[var(--surface-hover)] [&>div]:[--surface-hover:var(--surface-active)]',
  '[&_li>button]:h-full [&_li>button]:rounded-[inherit] [&>div>button]:h-full [&>div>button]:w-9 [&>div>button]:rounded-[inherit]',
].join(' ');

/**
 * The small buttons of the admin top bar held together as one piece, the way the play button
 * holds its halves: each a filled segment of its own, a hair apart, squared where they meet and
 * rounded only at the two ends, so what is waiting and the bell read as one control rather than
 * loose icons beside the search.
 *
 * @param children - The buttons, each its own segment.
 */
const BarButtonGroup = ({ children }: BarButtonGroupProps) => (
  <div
    className={cn(
      'flex h-8 shrink-0 items-stretch gap-[3px] has-[>*:only-child:empty]:hidden',
      '[&>ul]:flex [&>ul]:items-stretch [&>ul]:gap-[3px]',
      SEGMENT,
      '[&>ul:first-child>li:first-child]:rounded-s-lg [&>div:first-child]:rounded-s-lg',
      '[&>div:last-child]:rounded-e-lg [&>ul:has(+div:empty)>li:last-child]:rounded-e-lg [&>ul:last-child>li:last-child]:rounded-e-lg',
    )}
  >
    {children}
  </div>
);

BarButtonGroup.displayName = 'BarButtonGroup';

export { BarButtonGroup };
