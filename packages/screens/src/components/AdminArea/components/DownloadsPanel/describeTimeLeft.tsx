import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { partsOfTimeLeft } from '@ValenceCore/functions/partsOfTimeLeft';
import { say } from '@ValenceI18n/say';

/**
 * Says how long a download has left the way somebody would say it, to the nearest useful unit
 * rather than to the second, since a client's estimate is never that good.
 *
 * @param seconds - The time left.
 * @returns Such as `Under a minute`, `12 min`, `3 h 4 min` or `2 days`, with the numbers rolling.
 */
const describeTimeLeft = (seconds: number): ReactNode => {
  const parts = partsOfTimeLeft(seconds);

  if (parts === null) {
    return say('admin.describeTimeLeft.underAMinute');
  }

  return parts.map((part, at) => (
    <Fragment key={part.unit}>
      {at === 0 ? null : ' '}
      <AnimatedNumber value={part.value} suffix={` ${part.unit}`} />
    </Fragment>
  ));
};

export { describeTimeLeft };
