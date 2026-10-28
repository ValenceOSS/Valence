import { Worker } from 'node:worker_threads';
import { z } from 'zod';
import type { Range } from '@ValenceCore/functions/findSharedAudio';
import type { AudioMatcher } from './AudioMatcher';

const RangeSchema = z.object({ startSeconds: z.number(), endSeconds: z.number() });

const AnsweredSchema = z.union([
  z.object({ id: z.number(), matched: z.map(z.string(), z.array(RangeSchema)) }),
  z.object({ id: z.number(), failure: z.string() }),
]);

type Waiting = {
  resolve: (matched: Map<string, Range[]>) => void;
  reject: (error: Error) => void;
};

/**
 * Where the matching thread's code is: beside the server's own bundle once built, and beside this
 * file while it runs from source, where the thread needs the same loader the server runs under to
 * read TypeScript.
 *
 * @returns The thread's file, and the options to start it with.
 */
const threadFile = (): { file: URL; execArgv: string[] } => {
  const isBuilt = import.meta.url.endsWith('.js');

  return isBuilt
    ? { file: new URL('./audioMatchingThread.js', import.meta.url), execArgv: [] }
    : {
        file: new URL('./audioMatchingThread.ts', import.meta.url),
        execArgv: ['--import', import.meta.resolve('tsx')],
      };
};

/**
 * Matches seasons' fingerprints on a thread of its own, so the arithmetic of intro and credit
 * detection, minutes of it on a season hundreds of episodes long, never keeps the server from
 * answering. One thread, so it never takes more than one processor; seasons queue for it in turn.
 * The thread starts when first wanted, and a thread that dies fails what it was asked and is
 * started afresh for the next season; what a dead thread says afterwards is not taken for news of
 * the one started in its place.
 *
 * @returns The matcher.
 */
const createThreadedAudioMatcher = (): AudioMatcher => {
  const waiting = new Map<number, Waiting>();
  let thread: Worker | null = null;
  let asked = 0;

  const failAll = (error: Error) => {
    for (const one of waiting.values()) {
      one.reject(error);
    }

    waiting.clear();
  };

  const start = (): Worker => {
    const { file, execArgv } = threadFile();
    const started = new Worker(file, { execArgv });

    started.unref();
    started.on('message', (message: Parameters<typeof AnsweredSchema.safeParse>[0]) => {
      const answered = AnsweredSchema.safeParse(message);

      if (!answered.success) {
        return;
      }

      const one = waiting.get(answered.data.id);

      waiting.delete(answered.data.id);

      if ('failure' in answered.data) {
        one?.reject(new Error(answered.data.failure));
      } else {
        one?.resolve(answered.data.matched);
      }
    });
    started.on('error', (error) => {
      if (thread === started) {
        thread = null;
        failAll(error instanceof Error ? error : new Error(String(error)));
      }
    });
    started.on('exit', () => {
      if (thread === started) {
        thread = null;
        failAll(new Error('The thread matching audio stopped before it answered.'));
      }
    });

    return started;
  };

  return {
    matchSeason: (season) =>
      new Promise((resolve, reject) => {
        const id = asked;

        asked += 1;
        waiting.set(id, { resolve, reject });
        thread ??= start();
        thread.postMessage({ id, season });
      }),
  };
};

export { createThreadedAudioMatcher };
