import type { ReactNode } from 'react';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86_400;

/**
 * Says how long a download has left the way somebody would say it, to the nearest useful unit
 * rather than to the second, since a client's estimate is never that good.
 *
 * @param seconds - The time left.
 * @returns Such as `Under a minute`, `12 min`, `3 h 4 min` or `2 days`, with the numbers rolling.
 */
const describeTimeLeft = (seconds: number): ReactNode => {
  if (seconds < MINUTE) {
    return 'Under a minute';
  }

  if (seconds < HOUR) {
    return <AnimatedNumber value={Math.round(seconds / MINUTE)} suffix=" min" />;
  }

  if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR);
    const minutes = Math.round((seconds % HOUR) / MINUTE);

    if (minutes === 0 || minutes === 60) {
      return <AnimatedNumber value={hours + (minutes === 60 ? 1 : 0)} suffix=" h" />;
    }

    return (
      <>
        <AnimatedNumber value={hours} suffix=" h" />{' '}
        <AnimatedNumber value={minutes} suffix=" min" />
      </>
    );
  }

  const days = Math.round(seconds / DAY);

  return <AnimatedNumber value={days} suffix={days === 1 ? ' day' : ' days'} />;
};

export { describeTimeLeft };
