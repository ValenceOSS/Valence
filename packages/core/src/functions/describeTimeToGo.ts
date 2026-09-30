import { partsOfTimeLeft } from '@ValenceCore/functions/partsOfTimeLeft';
import { say } from '@ValenceI18n/say';

/**
 * Says how long something has left in a few words, rounded the way a person would say it.
 *
 * @param seconds - How long it has left.
 * @returns Such as `about 12 min left`, `about 1 h 5 min left` or `under a minute left`.
 */
const describeTimeToGo = (seconds: number): string => {
  const parts = partsOfTimeLeft(seconds);

  return parts === null
    ? say('core.describeTimeToGo.underAMinuteLeft')
    : say('core.describeTimeToGo.aboutTimeLeft', {
        time: parts.map((part) => `${part.value.toString()} ${part.unit}`).join(' '),
      });
};

export { describeTimeToGo };
