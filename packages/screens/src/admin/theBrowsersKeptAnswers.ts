import { z } from 'zod';
import type { KeptAnswers } from '@ValenceClient/platform/Platform.types';
import type { AnswerDatabase, AnswerShelfReach, Asking } from './AnswerShelfReach';

const DATABASE = 'valence-kept-answers';

const SHELF = 'answers';

const BY_ACCOUNT = 'byAccount';

const KeptRecordSchema = z.object({
  accountId: z.string(),
  key: z.string(),
  text: z.string(),
});

/**
 * Waits for one request to the browser's database to answer.
 *
 * @param asking - The request.
 * @returns Its answer.
 */
const answerOf = <Answer>(asking: Asking<Answer>): Promise<Answer> =>
  new Promise((resolve, reject) => {
    asking.onsuccess = () => {
      resolve(asking.result);
    };
    asking.onerror = () => {
      reject(asking.error ?? new Error('The browser refused to keep the answer.'));
    };
  });

/**
 * Where a browser keeps the slow admin answers between visits: its own database rather than
 * `localStorage`, which holds a few megabytes at most and every file in a large library is more.
 *
 * Opening it is put off until it is first asked for, and a browser that will not open it at all, as
 * a private window may not, answers as one that has kept nothing.
 *
 * @param reach - How to reach the browser's databases, asked at the moment of opening, since
 *   reaching them can itself throw.
 * @returns What the platform keeps answers with.
 */
const theBrowsersKeptAnswers = (reach: () => AnswerShelfReach): KeptAnswers => {
  let opened: Promise<AnswerDatabase> | null = null;

  const open = (): Promise<AnswerDatabase> => {
    opened ??= new Promise<AnswerDatabase>((resolve, reject) => {
      const refuse = (error: Error) => {
        opened = null;
        reject(error);
      };

      try {
        const opening = reach().open(DATABASE, 1);

        opening.onupgradeneeded = () => {
          if (!opening.result.objectStoreNames.contains(SHELF)) {
            opening.result
              .createObjectStore(SHELF, { keyPath: ['accountId', 'key'] })
              .createIndex(BY_ACCOUNT, 'accountId');
          }
        };
        opening.onsuccess = () => {
          resolve(opening.result);
        };
        opening.onerror = () => {
          refuse(opening.error ?? new Error('The browser would not open its database.'));
        };
      } catch (error) {
        refuse(error instanceof Error ? error : new Error('The browser has no database.'));
      }
    });

    return opened;
  };

  return {
    readAll: async (accountId) => {
      const database = await open().catch(() => null);

      if (database === null) {
        return [];
      }

      const records = await answerOf(
        database
          .transaction(SHELF, 'readonly')
          .objectStore(SHELF)
          .index(BY_ACCOUNT)
          .getAll(accountId),
      );

      return records.flatMap((record) => {
        const read = KeptRecordSchema.safeParse(record);

        return read.success ? [{ key: read.data.key, text: read.data.text }] : [];
      });
    },
    write: async (accountId, key, text) => {
      const database = await open();

      await answerOf(
        database.transaction(SHELF, 'readwrite').objectStore(SHELF).put({ accountId, key, text }),
      );
    },
    forgetAll: async () => {
      const database = await open();

      await answerOf(database.transaction(SHELF, 'readwrite').objectStore(SHELF).clear());
    },
  };
};

export { theBrowsersKeptAnswers };
