import NumberFlow from '@number-flow/react';
import { cn } from '@ValenceUI/cn';
import type { AnimatedNumberProps } from './AnimatedNumber.types';

/**
 * A number that rolls to its new value, digit by digit, instead of being swapped for it — a count
 * that climbs as work gets done reads as movement, where one that only ever changes reads as a
 * flicker. Every number Valence shows is drawn with this, so they all move the same way and a change
 * to how they do is made in one place.
 *
 * Digits are set to the same width, so the number does not shudder sideways while it rolls. The
 * rolling digits are hidden from a screen reader and the number is said once, in plain text, beside
 * them — which is also what anything that reads the page as text sees.
 *
 * @param value - The number.
 * @param format - How to write it, in the terms `Intl.NumberFormat` takes, of the kinds a rolling
 *   number can.
 * @param prefix - Text written straight before it.
 * @param suffix - Text written straight after it.
 * @param className - Extra classes for the caller's own layout.
 */
const AnimatedNumber = ({ value, format, prefix, suffix, className }: AnimatedNumberProps) => (
  <span className={cn('tabular-nums', className)}>
    <span aria-hidden>
      <NumberFlow
        value={value}
        {...(format === undefined ? {} : { format })}
        {...(prefix === undefined ? {} : { prefix })}
        {...(suffix === undefined ? {} : { suffix })}
      />
    </span>

    <span className="sr-only">
      {prefix}
      {new Intl.NumberFormat(undefined, format).format(value)}
      {suffix}
    </span>
  </span>
);

AnimatedNumber.displayName = 'AnimatedNumber';

export { AnimatedNumber };
