import { say } from '@ValenceI18n/say';

const SECONDS_IN_HOUR = 3600;

const SECONDS_IN_MINUTE = 60;

/**
 * Says how long something lasted the way a person says it — a runtime, or how long somebody stayed.
 *
 * Anything under a minute is said in seconds rather than rounded to "0m", which is what a clip or a
 * tab opened by mistake would otherwise report.
 *
 * @param seconds - How long it lasted.
 * @returns The length, or null where there is nothing worth saying.
 */
const describeSpan = (seconds: number | null): string | null => {
  if (seconds === null || seconds <= 0) {
    return null;
  }

  if (seconds < SECONDS_IN_MINUTE) {
    return say('server.webhook.spanSeconds', { seconds: Math.round(seconds).toString() });
  }

  const hours = Math.floor(seconds / SECONDS_IN_HOUR);
  const minutes = Math.round((seconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);

  return hours === 0
    ? say('server.webhook.spanMinutes', { minutes: minutes.toString() })
    : say('server.webhook.spanHours', { hours: hours.toString(), minutes: minutes.toString() });
};

export { describeSpan };
