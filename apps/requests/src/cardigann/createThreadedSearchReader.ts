import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import { z } from 'zod';
import { ReleaseSchema } from '@ValenceContracts/schemas/Indexer';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { SearchResultsReader } from '@ValenceRequests/cardigann/SearchResultsReader';

const AnsweredSchema = z.union([
  z.object({ id: z.number(), releases: z.array(ReleaseSchema) }),
  z.object({ id: z.number(), failure: z.string() }),
  z.object({ id: z.number(), started: z.literal(true) }),
]);

const MOST_THREADS = 4;

const PAGE_MILLISECONDS = 20_000;

type Waiting = {
  resolve: (releases: Release[] | null) => void;
  timer: NodeJS.Timeout | null;
};

type Lane = {
  thread: Worker | null;
  waiting: Map<number, Waiting>;
};

/**
 * Where the thread's code is: the bundled file beside this one once built, or the source run through
 * tsx while developing.
 *
 * @returns The file, and what the thread is started with.
 */
const threadFile = (): { file: URL; execArgv: string[] } => {
  const isBuilt = import.meta.url.endsWith('.js');

  return isBuilt
    ? { file: new URL('./searchResultsThread.js', import.meta.url), execArgv: [] }
    : {
        file: new URL('./searchResultsThread.ts', import.meta.url),
        execArgv: ['--import', import.meta.resolve('tsx')],
      };
};

/**
 * Reads indexers' result pages on a few threads of their own, so parsing a page of a few hundred
 * rows never holds up the service's main thread, which answers everybody else. Each page goes to
 * whichever thread has least waiting on it, and a thread that stops is started again on the next
 * page. Where a thread cannot read a page, or is not there at all, the page is answered with `null`,
 * and the caller reads it itself, so a failure says exactly what it would have said before.
 *
 * A page that is not answered within the time given, counted from when its thread begins on it, is
 * read as having no results, and its thread is stopped, so a pattern that never finishes cannot
 * hold a thread, or be run again here. Pages waiting behind it are answered with `null`, so they are
 * read here as they would be without a thread, and a thread that stops on its own is treated the same
 * way: the page it was reading has no results and the others are read here.
 *
 * @param threads - How many threads to keep, one fewer than the machine's cores up to four unless
 *   given.
 * @param pageMilliseconds - How long a page may take.
 * @returns A reader of result pages.
 */
const createThreadedSearchReader = (
  threads = Math.max(1, Math.min(MOST_THREADS, availableParallelism() - 1)),
  pageMilliseconds = PAGE_MILLISECONDS,
): SearchResultsReader => {
  const lanes: Lane[] = Array.from({ length: threads }, () => ({
    thread: null,
    waiting: new Map(),
  }));
  let asked = 0;

  const settleAll = (lane: Lane) => {
    for (const one of lane.waiting.values()) {
      const wasBeingRead = one.timer !== null;

      if (one.timer !== null) {
        clearTimeout(one.timer);
      }

      one.resolve(wasBeingRead ? [] : null);
    }

    lane.waiting.clear();
  };

  const start = (lane: Lane): Worker => {
    const { file, execArgv } = threadFile();
    const started = new Worker(file, { execArgv });

    started.unref();
    started.on('message', (message: Parameters<typeof AnsweredSchema.safeParse>[0]) => {
      const answered = AnsweredSchema.safeParse(message);

      if (!answered.success) {
        return;
      }

      const one = lane.waiting.get(answered.data.id);

      if ('started' in answered.data) {
        if (one !== undefined && one.timer === null) {
          one.timer = setTimeout(() => {
            if (lane.thread === started) {
              lane.thread = null;
            }

            settleAll(lane);
            void started.terminate();
          }, pageMilliseconds);
          one.timer.unref();
        }

        return;
      }

      lane.waiting.delete(answered.data.id);

      if (one !== undefined && one.timer !== null) {
        clearTimeout(one.timer);
      }

      one?.resolve('failure' in answered.data ? null : answered.data.releases);
    });
    started.on('error', () => {
      if (lane.thread === started) {
        lane.thread = null;
        settleAll(lane);
      }
    });
    started.on('exit', () => {
      if (lane.thread === started) {
        lane.thread = null;
        settleAll(lane);
      }
    });

    return started;
  };

  return (page) =>
    new Promise((resolve) => {
      const lane = lanes.reduce((least, one) =>
        one.waiting.size < least.waiting.size ? one : least,
      );
      const id = asked;

      asked += 1;

      try {
        lane.thread ??= start(lane);
        lane.waiting.set(id, { resolve, timer: null });
        lane.thread.postMessage({ id, asked: page });
      } catch {
        lane.waiting.delete(id);
        resolve(null);
      }
    });
};

export { createThreadedSearchReader };
