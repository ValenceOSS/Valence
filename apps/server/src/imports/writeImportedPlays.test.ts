import { describe, expect, it } from 'vitest';
import { watchHistory } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { writeImportedPlays } from './writeImportedPlays';

describe('writeImportedPlays', { timeout: 60_000 }, () => {
  it('writes each viewing once with its own date, marked as imported', async () => {
    const { db } = await aHousehold();
    const plays = Array.from({ length: 250 }, (_, index) => ({
      profileId: 'pat',
      mediaItemId: 'film',
      at: new Date(Date.UTC(2020, 0, 1) + index * 86_400_000),
      secondsWatched: 5400,
      importKey: `source:pat:film:${index.toString()}`,
    }));

    await writeImportedPlays(db, 'jellyfin', plays);
    await writeImportedPlays(db, 'jellyfin', plays);
    await writeImportedPlays(db, 'jellyfin', []);

    const rows = await db.select().from(watchHistory);
    const first = rows.find((row) => row.importKey === 'source:pat:film:0');

    expect(rows).toHaveLength(250);
    expect(first).toMatchObject({
      importedFrom: 'jellyfin',
      isFinished: true,
      lastWatchedAt: new Date(Date.UTC(2020, 0, 1)),
      startedAt: new Date(Date.UTC(2020, 0, 1) - 5400 * 1000),
      secondsWatched: 5400,
    });
  });
});
