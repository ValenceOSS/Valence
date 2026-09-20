const MINUTE = 60;
const HOUR = 3600;
const DAY = 86_400;

/**
 * Says how long a download has left the way somebody would say it, to the nearest useful unit
 * rather than to the second, since a client's estimate is never that good.
 *
 * @param seconds - The time left.
 * @returns Such as `Under a minute`, `12 min`, `3 h 4 min` or `2 days`.
 */
const describeTimeLeft = (seconds: number): string => {
  if (seconds < MINUTE) {
    return 'Under a minute';
  }

  if (seconds < HOUR) {
    return `${Math.round(seconds / MINUTE).toString()} min`;
  }

  if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR);
    const minutes = Math.round((seconds % HOUR) / MINUTE);

    return minutes === 0 || minutes === 60
      ? `${(hours + (minutes === 60 ? 1 : 0)).toString()} h`
      : `${hours.toString()} h ${minutes.toString()} min`;
  }

  const days = Math.round(seconds / DAY);

  return days === 1 ? '1 day' : `${days.toString()} days`;
};

export { describeTimeLeft };
