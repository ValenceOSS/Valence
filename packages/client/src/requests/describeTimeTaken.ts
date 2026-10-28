import { say } from '@ValenceI18n/say';

/**
 * Says how long something took in the fewest characters that still read plainly, such as "12s",
 * "4m", "1h 24m" or "2d 3h".
 *
 * @param from - When it started.
 * @param to - When it ended.
 * @returns The words, never less than a second.
 */
const describeTimeTaken = (from: string, to: string): string => {
  const seconds = Math.max(Math.round((Date.parse(to) - Date.parse(from)) / 1000), 1);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes === 0) {
    return say('client.requests.describeTimeTaken.seconds', { seconds: seconds.toString() });
  }

  if (hours === 0) {
    return say('client.requests.describeTimeTaken.minutes', { minutes: minutes.toString() });
  }

  return days === 0
    ? say('client.requests.describeTimeTaken.hoursMinutes', {
        hours: hours.toString(),
        minutes: (minutes % 60).toString(),
      })
    : say('client.requests.describeTimeTaken.daysHours', {
        days: days.toString(),
        hours: (hours % 24).toString(),
      });
};

export { describeTimeTaken };
