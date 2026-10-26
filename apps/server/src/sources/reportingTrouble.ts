import { nameOfSource } from './nameOfSource';
import { reportStatus } from './reportStatus';
import { troubleWatch } from './troubleWatch';

type Ask = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Wraps a way out to the web so that what goes wrong on it is reported to the trouble watch, for a
 * reader that turns every failure into nothing itself.
 *
 * @param ask - The way out to wrap.
 * @returns The same way out, reporting a rate limit, a refusal, a fault or no answer at all.
 */
const reportingTrouble =
  (ask: Ask): Ask =>
  async (url, init) => {
    const source = nameOfSource(url);

    try {
      const answer = await ask(url, init);

      reportStatus(url, answer.status);

      return answer;
    } catch (error) {
      troubleWatch.report({ source, reason: 'unreachable' });

      throw error;
    }
  };

export type { Ask };

export { reportingTrouble };
