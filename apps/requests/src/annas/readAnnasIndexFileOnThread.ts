import { Worker } from 'node:worker_threads';
import { z } from 'zod';
import { AnnasBookRecordSchema } from '@ValenceRequests/annas/AnnasBookRecordSchema';
import type { AnnasIndexReader } from '@ValenceRequests/annas/AnnasIndexReader';

const SaidSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('batch'), books: z.array(AnnasBookRecordSchema) }),
  z.object({ kind: z.literal('read'), read: z.number() }),
  z.object({ kind: z.literal('done'), read: z.number() }),
  z.object({ kind: z.literal('failed'), message: z.string() }),
]);

/**
 * Where the thread's code is: the bundled file beside this one once built, or the source run through
 * tsx while developing.
 *
 * @returns The file, and what the thread is started with.
 */
const threadFile = (): { file: URL; execArgv: string[] } =>
  import.meta.url.endsWith('.js')
    ? { file: new URL('./annasIndexThread.js', import.meta.url), execArgv: [] }
    : {
        file: new URL('./annasIndexThread.ts', import.meta.url),
        execArgv: ['--import', import.meta.resolve('tsx')],
      };

/**
 * Reads one file of Anna's Archive's index on a thread of its own, so several files are read at
 * once on as many cores, with each batch it finds kept here before the thread reads on.
 *
 * @param file - The file.
 * @param wanted - Which languages, formats and torrents are kept.
 * @param sink - Where each batch goes, and how far it has got.
 * @returns How many records were read.
 */
const readAnnasIndexFileOnThread: AnnasIndexReader = (file, wanted, sink) => {
  const { file: code, execArgv } = threadFile();
  const thread = new Worker(code, {
    execArgv,
    workerData: {
      file,
      torrentKeys: [...wanted.torrentKeys],
      languages: [...wanted.languages],
      formats: [...wanted.formats],
    },
  });

  return new Promise<number>((resolve, reject) => {
    let settled = false;

    const finish = (outcome: () => void) => {
      if (!settled) {
        settled = true;
        outcome();
        void thread.terminate();
      }
    };

    thread.on('message', (message) => {
      const said = SaidSchema.safeParse(message);

      if (!said.success) {
        return;
      }

      if (said.data.kind === 'batch') {
        void sink
          .keep(said.data.books)
          .then(() => {
            thread.postMessage('kept');
          })
          .catch((error: Error) => {
            finish(() => {
              reject(error);
            });
          });
      } else if (said.data.kind === 'read') {
        sink.onRead(said.data.read);
      } else if (said.data.kind === 'done') {
        const { read } = said.data;

        finish(() => {
          sink.onRead(read);
          resolve(read);
        });
      } else {
        const { message: failure } = said.data;

        finish(() => {
          reject(new Error(failure));
        });
      }
    });

    thread.on('error', (error: Error) => {
      finish(() => {
        reject(error);
      });
    });

    thread.on('exit', () => {
      finish(() => {
        reject(new Error(`The thread reading ${file} stopped.`));
      });
    });
  });
};

export { readAnnasIndexFileOnThread };
