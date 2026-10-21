import { describe, expect, it } from 'vitest';
import { theBrowsersKeptAnswers } from './theBrowsersKeptAnswers';
import type {
  AnswerDatabase,
  AnswerShelf,
  AnswerShelfReach,
  Asking,
  KeptRecord,
  OpeningAnswers,
} from './AnswerShelfReach';

/**
 * A request to the fake database that answers on the next turn, as a browser's does.
 *
 * @param answer - What it answers.
 * @returns The request.
 */
const asking = <Answer>(answer: Answer): Asking<Answer> => {
  const request: Asking<Answer> = { result: answer, error: null, onsuccess: null, onerror: null };

  setTimeout(() => {
    request.onsuccess?.(new Event('success'));
  }, 0);

  return request;
};

/**
 * A browser database held in memory, with the one shelf and index the answers are kept in.
 *
 * @returns How to reach it, and how many times it was opened.
 */
const aBrowserDatabase = () => {
  const records = new Map<string, KeptRecord | object>();
  const shelves = new Set<string>();
  let opened = 0;

  const shelf: AnswerShelf = {
    put: (record) => {
      records.set(`${record.accountId}/${record.key}`, record);

      return asking<IDBValidKey>(record.key);
    },
    clear: () => {
      records.clear();

      return asking(undefined);
    },
    index: () => ({
      getAll: (accountId) =>
        asking(
          [...records.values()].filter(
            (record) => 'accountId' in record && record.accountId === accountId,
          ),
        ),
    }),
  };

  const database: AnswerDatabase = {
    objectStoreNames: { contains: (name) => shelves.has(name) },
    createObjectStore: (name) => {
      shelves.add(name);

      return { createIndex: () => ({}) };
    },
    transaction: () => ({ objectStore: () => shelf }),
  };

  const reach: AnswerShelfReach = {
    open: () => {
      opened += 1;

      const request: OpeningAnswers = {
        result: database,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      setTimeout(() => {
        if (shelves.size === 0) {
          request.onupgradeneeded?.(
            Object.assign(new Event('upgradeneeded'), { oldVersion: 0, newVersion: 1 }),
          );
        }

        request.onsuccess?.(new Event('success'));
      }, 0);

      return request;
    },
  };

  return { reach, records, timesOpened: () => opened };
};

describe('theBrowsersKeptAnswers', () => {
  it('reads back what was written, for the account it was written for', async () => {
    const browser = aBrowserDatabase();
    const kept = theBrowsersKeptAnswers(() => browser.reach);

    await kept.write('account-1', 'libraries', '[1]');
    await kept.write('account-2', 'libraries', '[2]');

    await expect(kept.readAll('account-1')).resolves.toEqual([{ key: 'libraries', text: '[1]' }]);
  });

  it('writes over what an answer said before', async () => {
    const browser = aBrowserDatabase();
    const kept = theBrowsersKeptAnswers(() => browser.reach);

    await kept.write('account-1', 'libraries', '[1]');
    await kept.write('account-1', 'libraries', '[2]');

    await expect(kept.readAll('account-1')).resolves.toEqual([{ key: 'libraries', text: '[2]' }]);
  });

  it('forgets everything for everybody at once', async () => {
    const browser = aBrowserDatabase();
    const kept = theBrowsersKeptAnswers(() => browser.reach);

    await kept.write('account-1', 'libraries', '[1]');
    await kept.forgetAll();

    await expect(kept.readAll('account-1')).resolves.toEqual([]);
  });

  it('opens the database once, however often it is asked', async () => {
    const browser = aBrowserDatabase();
    const kept = theBrowsersKeptAnswers(() => browser.reach);

    await kept.write('account-1', 'a', '1');
    await kept.write('account-1', 'b', '2');
    await kept.readAll('account-1');

    expect(browser.timesOpened()).toBe(1);
  });

  it('passes over a record that is not one it wrote', async () => {
    const browser = aBrowserDatabase();
    const kept = theBrowsersKeptAnswers(() => browser.reach);

    browser.records.set('stray', { accountId: 'account-1', key: 1 });

    await expect(kept.readAll('account-1')).resolves.toEqual([]);
  });

  it('answers as one that has kept nothing where the browser has no database to give', async () => {
    const kept = theBrowsersKeptAnswers(() => {
      throw new Error('private window');
    });

    await expect(kept.readAll('account-1')).resolves.toEqual([]);
    await expect(kept.write('account-1', 'a', '1')).rejects.toThrow('private window');
  });
});
