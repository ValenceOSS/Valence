import { Fragment } from 'react';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { cn } from '@ValenceUI/cn';
import { splitElapsed } from '@ValenceClient/admin/splitElapsed';
import type { ElapsedTimeProps } from './ElapsedTime.types';

/**
 * How long something took, or has been going, drawn with each of its numbers rolling to its new
 * value: "2 min 5 s" whose seconds climb as the time does, rather than the text being swapped.
 *
 * @param ms - How long.
 * @param className - Extra classes for the caller's own layout.
 */
const ElapsedTime = ({ ms, className }: ElapsedTimeProps) => (
  <span className={cn('whitespace-nowrap', className)}>
    {splitElapsed(ms).map((part, at) => (
      <Fragment key={part.unit}>
        {at === 0 ? '' : ' '}
        <AnimatedNumber
          value={part.value}
          suffix={` ${part.unit}`}
          {...(part.isFractional ? { format: { maximumFractionDigits: 1 } } : {})}
        />
      </Fragment>
    ))}
  </span>
);

ElapsedTime.displayName = 'ElapsedTime';

export { ElapsedTime };
