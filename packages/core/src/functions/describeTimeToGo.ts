import { partsOfTimeLeft } from '@ValenceCore/functions/partsOfTimeLeft';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Says how long something has left in a few words, rounded the way a person would say it.
 *
 * @param seconds - How long it has left.
 * @returns Such as `about 12 min left`, `about 1 h 5 min left` or `under a minute left`.
 */
const describeTimeToGo = (seconds: number): string => {
  const parts = partsOfTimeLeft(seconds);

  if (parts === null) {
    return say('core.describeTimeToGo.underAMinute');
  }

  const [first, second] = parts;
  const value = first?.value ?? 0;

  if (second !== undefined) {
    return say('core.describeTimeToGo.hoursAndMinutes', {
      hours: value.toString(),
      minutes: second.value.toString(),
    });
  }

  if (first?.unit === 'min') {
    return say('core.describeTimeToGo.minutes', { minutes: value.toString() });
  }

  return first?.unit === 'h'
    ? say('core.describeTimeToGo.hours', { hours: value.toString() })
    : sayCount('core.describeTimeToGo.days', value);
};

export { describeTimeToGo };
