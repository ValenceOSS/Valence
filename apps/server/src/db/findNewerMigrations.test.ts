import { describe, expect, it } from 'vitest';
import { findNewerMigrations } from '@ValenceServer/db/findNewerMigrations';

const journal = JSON.stringify({ entries: [{ when: 1 }, { when: 2 }] });

describe('findNewerMigrations', () => {
  it('finds none where the database has run only what the journal lists', async () => {
    const newer = await findNewerMigrations({
      readJournal: () => Promise.resolve(journal),
      readAppliedAt: () => Promise.resolve([1, 2]),
    });

    expect(newer).toEqual([]);
  });

  it('finds what a newer release ran', async () => {
    const newer = await findNewerMigrations({
      readJournal: () => Promise.resolve(journal),
      readAppliedAt: () => Promise.resolve([1, 2, 3, 4]),
    });

    expect(newer).toEqual([3, 4]);
  });
});
