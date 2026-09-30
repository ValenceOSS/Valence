import { say } from '@ValenceI18n/say';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Says how long until something happens, to the second when it is under an hour away and more
 * coarsely beyond that, where seconds would only flicker.
 *
 * @param remaining - Milliseconds until it happens.
 * @returns The wait, such as "in 4m 07s", "in 5h 12m" or "in 3d 4h".
 */
const describeCountdown = (remaining: number): string => {
  if (remaining < SECOND) {
    return say('screens.jobRunner.describeCountdown.dueNow');
  }

  const pad = (value: number): string => value.toString().padStart(2, '0');

  if (remaining < HOUR) {
    return say('screens.jobRunner.describeCountdown.inValueMValue2S', {
      value: Math.floor(remaining / MINUTE).toString(),
      value2: pad(Math.floor((remaining % MINUTE) / SECOND)),
    });
  }

  if (remaining < DAY) {
    return say('screens.jobRunner.describeCountdown.inValueHValue2M', {
      value: Math.floor(remaining / HOUR).toString(),
      value2: pad(Math.floor((remaining % HOUR) / MINUTE)),
    });
  }

  return say('screens.jobRunner.describeCountdown.inValueDValue2H', {
    value: Math.floor(remaining / DAY).toString(),
    value2: Math.floor((remaining % DAY) / HOUR).toString(),
  });
};

export { describeCountdown };
