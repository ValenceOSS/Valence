/**
 * How many seconds the time left an app gives for a download comes to, from its `d.hh:mm:ss` or
 * `hh:mm:ss`.
 *
 * @param timeLeft - What the app says, if anything.
 * @returns The seconds, or null where it says nothing readable.
 */
const secondsOfTimeLeft = (timeLeft: string | null | undefined): number | null => {
  const read = /^(?:(\d+)\.)?(\d+):(\d+):(\d+)/.exec(timeLeft ?? '');

  if (read === null) {
    return null;
  }

  const [, days = '0', hours = '0', minutes = '0', seconds = '0'] = read;

  return ((Number(days) * 24 + Number(hours)) * 60 + Number(minutes)) * 60 + Number(seconds);
};

export { secondsOfTimeLeft };
