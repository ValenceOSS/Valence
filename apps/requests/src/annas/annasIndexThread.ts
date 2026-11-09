import { parentPort, workerData } from 'node:worker_threads';
import { z } from 'zod';
import { readAnnasIndexFile } from '@ValenceRequests/annas/readAnnasIndexFile';

const AskedSchema = z.object({
  file: z.string(),
  torrentKeys: z.array(z.string()),
  languages: z.array(z.string()),
  formats: z.array(z.string()),
});

/**
 * Waits for the service to say it has kept the last batch sent, so a thread never reads further
 * ahead than the database can keep up with.
 *
 * @returns Once it has.
 */
const untilKept = (): Promise<void> =>
  new Promise((resolve) => {
    parentPort?.once('message', () => {
      resolve();
    });
  });

/**
 * Reads the one file of Anna's Archive's index it was started with, off the service's main thread,
 * sending back each batch of books wanted and how far it has got, and at the end how many records
 * it read, or why it could not.
 */
const readTheFile = async (): Promise<void> => {
  const asked = AskedSchema.parse(workerData);

  try {
    const read = await readAnnasIndexFile(
      asked.file,
      {
        torrentKeys: new Set(asked.torrentKeys),
        languages: new Set(asked.languages),
        formats: new Set(asked.formats),
      },
      {
        keep: async (books) => {
          if (books.length === 0) {
            return;
          }

          const kept = untilKept();

          parentPort?.postMessage({ kind: 'batch', books });
          await kept;
        },
        onRead: (count) => {
          parentPort?.postMessage({ kind: 'read', read: count });
        },
      },
    );

    parentPort?.postMessage({ kind: 'done', read });
  } catch (error) {
    parentPort?.postMessage({
      kind: 'failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

void readTheFile();
