import { cn } from '@ValenceUI/cn';
import { ValenceRun } from '@ValenceLanding/components/ValenceRun/ValenceRun';
import type { ValenceBandProps } from './ValenceBand.types';

/**
 * A band right across the page with Valence's name running past along it, which the app in the
 * hero hangs over: the accent blue with white letters in the light, and pale in the dark.
 *
 * @param className - Its place on the page, which the hero decides.
 */
const ValenceBand = ({ className }: ValenceBandProps) => (
  <div
    aria-hidden
    className={cn(
      'relative -mx-2 overflow-hidden bg-accent pb-2 text-accent-contrast dark:bg-text dark:text-surface sm:-mx-3',
      className,
    )}
  >
    <ValenceRun className="pt-[4vw] text-[clamp(3rem,8vw,7rem)] xl:pt-[3.5rem]" />
  </div>
);

ValenceBand.displayName = 'ValenceBand';

export { ValenceBand };
