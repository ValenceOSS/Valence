import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { hidden, library, mediaItem } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { trackVisibleTo } from './trackVisibleTo';

const STARTING_POSTGRES_MS = 60_000;

describe('trackVisibleTo', { timeout: STARTING_POSTGRES_MS }, () => {
  it('holds for what is in a music library and not hidden from the viewer', async () => {
    const { db, viewer } = await aHousehold();

    await db
      .insert(mediaItem)
      .values([aMediaItemRow('song', 'music'), aMediaItemRow('hidden-song', 'music')]);
    await db.insert(hidden).values({ id: 'h1', profileId: 'pat', mediaItemId: 'hidden-song' });

    const rows = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(trackVisibleTo(db, viewer));

    expect(rows).toEqual([{ id: 'song' }]);
  });
});
