import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import type { SwapProps } from './Swap.types';

/**
 * Two versions of one small thing in the same place, the first while the feature rests and the
 * second while it is pointed at, crossing over so the change reads as the feature doing its work.
 *
 * @param from - What it shows at rest.
 * @param to - What it shows while the feature is acted out.
 * @param delay - How long after the pointer arrives it changes, in milliseconds.
 * @param className - Extra classes for the caller's own layout.
 */
const Swap = ({ from, to, delay = 0, className }: SwapProps) => (
  <span className={cn('inline-grid items-center', className)}>
    <span
      className={cn('[grid-area:1/1]', ACTING, 'acted:-translate-y-1 acted:opacity-0')}
      style={{ transitionDelay: `${delay.toString()}ms` }}
    >
      {from}
    </span>
    <span
      className={cn(
        '[grid-area:1/1] translate-y-1 opacity-0',
        ACTING,
        'acted:translate-y-0 acted:opacity-100',
      )}
      style={{ transitionDelay: `${delay.toString()}ms` }}
    >
      {to}
    </span>
  </span>
);

Swap.displayName = 'Swap';

export { Swap };
