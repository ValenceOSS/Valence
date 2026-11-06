/**
 * When a download should finish, on the clock: the time alone where that is today, and the weekday
 * with it where it is not.
 *
 * @param secondsLeft - How long is left.
 * @param nowMs - Now.
 * @param locale - Whose language, the viewer's own unless given.
 * @returns Such as `22:41` or `Fri 09:12`.
 */
const describeFinishTime = (secondsLeft: number, nowMs: number, locale?: string): string => {
  const at = new Date(nowMs + secondsLeft * 1000);
  const isToday = at.toDateString() === new Date(nowMs).toDateString();

  return new Intl.DateTimeFormat(locale, {
    ...(isToday ? {} : { weekday: 'short' }),
    hour: '2-digit',
    minute: '2-digit',
  }).format(at);
};

export { describeFinishTime };
