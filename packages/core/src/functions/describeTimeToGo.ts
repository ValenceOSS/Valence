import { partsOfTimeLeft } from '@ValenceCore/functions/partsOfTimeLeft';

/**
 * Says how long something has left in a few words, rounded the way a person would say it.
 *
 * @param seconds - How long it has left.
 * @returns Such as `about 12 min left`, `about 1 h 5 min left` or `under a minute left`.
 */
const describeTimeToGo = (seconds: number): string => {
  const parts = partsOfTimeLeft(seconds);

  return parts === null
    ? 'under a minute left'
    : `about ${parts.map((part) => `${part.value.toString()} ${part.unit}`).join(' ')} left`;
};

export { describeTimeToGo };
