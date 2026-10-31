import type { TrailerAddresses } from './TrailerAddresses';
import type { TrailerAnswer } from './TrailerAnswer';

const KEPT_WHERE_NO_EXPIRY_IS_SAID = 3 * 60 * 60 * 1000;

const FORGOTTEN_EARLY_BY = 10 * 60 * 1000;

const FAILURE_KEPT_FOR = 24 * 60 * 60 * 1000;

const BETWEEN_PREPARED = 1000;

type Known = { url: string | null; until: number };

type TrailerAddressOptions = {
  ask: (youTubeId: string) => Promise<TrailerAnswer>;
  now?: () => number;
  wait?: (ms: number) => Promise<void>;
  onProblem?: (youTubeId: string, why: string) => void;
};

/**
 * How long a found address may be kept: until shortly before the expiry YouTube writes into it,
 * or a few hours where it writes none.
 *
 * @param url - The address.
 * @param now - The time now.
 * @returns When to forget it.
 */
const keptUntil = (url: string, now: number): number => {
  const expire = Number(new URL(url).searchParams.get('expire'));

  return Number.isFinite(expire) && expire > 0
    ? expire * 1000 - FORGOTTEN_EARLY_BY
    : now + KEPT_WHERE_NO_EXPIRY_IS_SAID;
};

/**
 * Where each title's trailer can be streamed from, found once and kept, so a title opened twice
 * is looked up once and a page asking for the same trailer a hundred times in byte ranges asks
 * YouTube once.
 *
 * Two pages asking at the same moment share one lookup. A trailer that could not be found is
 * remembered as not found for a day, so a server YouTube refuses does not go on asking. What is
 * prepared ahead — the titles on Discover — is looked up one at a time, a second apart, in the
 * background, skipping whatever is known already, so the trailer is there before anybody opens the
 * title.
 *
 * @param options - How to ask for an address, and, for tests, the clock and the pause between
 *   prepared titles; and who to tell when one could not be found.
 * @returns The addresses.
 */
const createTrailerAddresses = ({
  ask,
  now = Date.now,
  wait = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    }),
  onProblem,
}: TrailerAddressOptions): TrailerAddresses => {
  const known = new Map<string, Known>();
  const asking = new Map<string, Promise<string | null>>();
  let isPreparing = false;

  const lookUp = async (
    title: string,
    readYouTubeId: () => Promise<string | null>,
  ): Promise<string | null> => {
    const youTubeId = await readYouTubeId().catch(() => null);

    if (youTubeId === null) {
      known.set(title, { url: null, until: now() + FAILURE_KEPT_FOR });

      return null;
    }

    const answer = await ask(youTubeId);

    if (answer.kind === 'failed') {
      onProblem?.(youTubeId, answer.why);
      known.set(title, { url: null, until: now() + FAILURE_KEPT_FOR });

      return null;
    }

    known.set(title, { url: answer.url, until: keptUntil(answer.url, now()) });

    return answer.url;
  };

  const find: TrailerAddresses['find'] = (title, readYouTubeId) => {
    const held = known.get(title);

    if (held !== undefined && held.until > now()) {
      return Promise.resolve(held.url);
    }

    const already = asking.get(title);

    if (already !== undefined) {
      return already;
    }

    const looking = lookUp(title, readYouTubeId).finally(() => {
      asking.delete(title);
    });

    asking.set(title, looking);

    return looking;
  };

  return {
    find,
    forget: (title) => {
      known.delete(title);
    },
    prepare: (titles) => {
      if (isPreparing) {
        return;
      }

      isPreparing = true;

      void (async () => {
        for (const { title, readYouTubeId } of titles) {
          const held = known.get(title);

          if (held === undefined || held.until <= now()) {
            await find(title, readYouTubeId);
            await wait(BETWEEN_PREPARED);
          }
        }
      })().finally(() => {
        isPreparing = false;
      });
    },
  };
};

export { createTrailerAddresses };
