import { createExpiringCache } from '@ValenceServer/library/createExpiringCache';
import { troubleWatch } from './troubleWatch';
import type { Watched } from './createTroubleWatch';
import type { TroubleReason } from './SourceTrouble';

type AnswerKeeper<Answer> = {
  keep: (key: string, read: () => Promise<Answer>) => Promise<Answer>;
  clear: () => void;
};

type AnswerKeeperOptions = {
  holds?: number;
  now?: () => number;
};

const TROUBLE_LASTS_MS = 60_000;

const PASSING: ReadonlySet<TroubleReason> = new Set(['rateLimited', 'faulty', 'unreachable']);

/**
 * Keeps what a site answered for a while, so the same question is asked once — and keeps what was
 * answered while the site was failing for no more than a minute, saying why to everyone who reads
 * it.
 *
 * A rate limit, a fault or an unreachable site is kept that minute so a scan asking the same thing
 * for every episode, or a calendar asking for every series, does not hammer a site that is already
 * struggling, and is then asked again rather than handed back for as long as an answer would have
 * lasted. A missing or refused key is not kept at all, since asking again costs nothing until the
 * key is fixed and should work the moment it is. A read that threw is not kept either.
 *
 * @param livesForMs - How long an answer is kept.
 * @param options - How many answers to hold at most, and what the time is.
 * @returns The keeper.
 */
const createAnswerKeeper = <Answer>(
  livesForMs: number,
  options: AnswerKeeperOptions = {},
): AnswerKeeper<Answer> => {
  const kept = createExpiringCache<Promise<Watched<Answer>>>(livesForMs, options);
  const troubled = createExpiringCache<Promise<Watched<Answer>>>(TROUBLE_LASTS_MS, options);

  const forget = (key: string, reading: Promise<Watched<Answer>>) => {
    if (kept.get(key) === reading) {
      kept.delete(key);
    }
  };

  const start = (key: string, read: () => Promise<Answer>) => {
    const reading = troubleWatch.during(read);

    kept.set(key, reading);

    void reading.then(
      ({ trouble }) => {
        if (trouble === null) {
          return;
        }

        forget(key, reading);

        if (PASSING.has(trouble.reason)) {
          troubled.set(key, reading);
        }
      },
      () => {
        forget(key, reading);
      },
    );

    return reading;
  };

  return {
    keep: async (key, read) => {
      const { value, trouble } = await (kept.get(key) ?? troubled.get(key) ?? start(key, read));

      if (trouble !== null) {
        troubleWatch.report(trouble);
      }

      return value;
    },

    clear: () => {
      kept.clear();
      troubled.clear();
    },
  };
};

export type { AnswerKeeper };

export { createAnswerKeeper };
