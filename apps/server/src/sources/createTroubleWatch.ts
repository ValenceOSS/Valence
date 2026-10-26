import { AsyncLocalStorage } from 'node:async_hooks';
import type { SourceTrouble } from './SourceTrouble';

type Watcher = { trouble: SourceTrouble | null; outer: Watcher | undefined };

type Watched<Answer> = { value: Answer; trouble: SourceTrouble | null };

type TroubleWatch = {
  during: <Answer>(read: () => Promise<Answer>) => Promise<Watched<Answer>>;
  contain: <Answer>(read: () => Promise<Answer>) => Promise<Watched<Answer>>;
  outside: <Answer>(run: () => Answer) => Answer;
  report: (trouble: SourceTrouble) => void;
};

/**
 * Lets a read find out whether a site it asked along the way failed, without every function between
 * the two passing it back.
 *
 * A search, a page or a cached answer is put together from requests made many calls deeper, and
 * each of those requests turns a failure into nothing so that one bad site cannot fail a whole
 * scan. Nothing is also what a site says when it has no such thing, so by the time an answer comes
 * back the two cannot be told apart: a cache keeps a rate limit as if it were the answer, and a
 * search says "no results" for a refused key. Whoever asks the site reports what went wrong here,
 * and every read it was asked for hears of it.
 *
 * Held against the async execution doing the work rather than in a variable, so two reads running
 * at once do not hear each other's trouble. A read inside another passes what it hears outwards,
 * unless it is contained — for a caller that tries one source after another and only fails if the
 * last does — and work started for nobody in particular, such as a queued job, runs outside it.
 *
 * @returns The watch.
 */
const createTroubleWatch = (): TroubleWatch => {
  const holder = new AsyncLocalStorage<Watcher>();

  const watch = async <Answer>(
    read: () => Promise<Answer>,
    outer: Watcher | undefined,
  ): Promise<Watched<Answer>> => {
    const watcher: Watcher = { trouble: null, outer };
    const value = await holder.run(watcher, read);

    return { value, trouble: watcher.trouble };
  };

  return {
    during: (read) => watch(read, holder.getStore()),

    contain: (read) => watch(read, undefined),

    outside: (run) => holder.exit(run),

    report: (trouble) => {
      for (let watcher = holder.getStore(); watcher !== undefined; watcher = watcher.outer) {
        watcher.trouble ??= trouble;
      }
    },
  };
};

export type { TroubleWatch, Watched };

export { createTroubleWatch };
