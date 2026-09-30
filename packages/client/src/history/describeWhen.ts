import { say } from '@ValenceI18n/say';

const A_MINUTE = 60_000;
const AN_HOUR = 60 * A_MINUTE;
const A_DAY = 24 * AN_HOUR;
const A_WEEK = 7 * A_DAY;

const dayAndMonth = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const withYear = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * Says when something was watched the way a person would — today, yesterday, a weekday name within
 * the week, and a date beyond that. A history full of timestamps is a history nobody reads.
 *
 * @param at - When it was watched.
 * @param now - What to treat as now, so the phrasing can be tested.
 * @returns The phrase to show.
 */
const describeWhen = (at: Date, now: Date): string => {
  const since = now.getTime() - at.getTime();

  if (since < A_MINUTE) {
    return say('client.history.describeWhen.justNow');
  }

  if (since < AN_HOUR) {
    const minutes = Math.floor(since / A_MINUTE);

    return say('client.history.describeWhen.minutesMinAgo', { minutes: minutes.toString() });
  }

  if (since < A_DAY) {
    const hours = Math.floor(since / AN_HOUR);

    return hours === 1
      ? say('client.history.describeWhen.anHourAgo')
      : say('common.hoursHoursAgo', { hours: hours.toString() });
  }

  if (since < 2 * A_DAY) {
    return say('client.history.describeWhen.yesterday');
  }

  if (since < A_WEEK) {
    const days = Math.floor(since / A_DAY);

    return say('common.daysDaysAgo', { days: days.toString() });
  }

  return at.getFullYear() === now.getFullYear() ? dayAndMonth.format(at) : withYear.format(at);
};

export { describeWhen };
