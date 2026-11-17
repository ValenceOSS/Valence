import { describe, expect, it } from 'vitest';
import { asc, desc, eq } from 'drizzle-orm';
import { mediaItem } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { firstOfEachShow } from './firstOfEachShow';

const STARTING_POSTGRES_MS = 60_000;

describe('firstOfEachShow', { timeout: STARTING_POSTGRES_MS }, () => {
  it('keeps one episode of each programme, the first in the order asked, and every film', async () => {
    const { db } = await aHousehold();
    const episode = (id: string, seriesTitle: string, day: number) => ({
      ...aMediaItemRow(id, 'films'),
      path: `/films/${id}.mkv`,
      title: id,
      seriesTitle,
      addedAt: new Date(Date.UTC(2026, 10, day)),
    });

    await db
      .insert(mediaItem)
      .values([episode('old', 'Show', 1), episode('new', 'Show', 3), episode('other', 'Other', 2)]);

    const ordering = [desc(mediaItem.addedAt), asc(mediaItem.id)];
    const kept = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(firstOfEachShow(undefined, ordering))
      .orderBy(...ordering);

    expect(kept.map((one) => one.id).sort()).toEqual(['film', 'new', 'other']);
  });

  it('chooses only among what the listing already asks for', async () => {
    const { db } = await aHousehold();

    await db.insert(mediaItem).values([
      { ...aMediaItemRow('a', 'films'), path: '/films/a.mkv', title: 'A', seriesTitle: 'Show' },
      { ...aMediaItemRow('b', 'films'), path: '/films/b.mkv', title: 'B', seriesTitle: 'Show' },
    ]);

    const kept = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(firstOfEachShow(eq(mediaItem.title, 'B'), [asc(mediaItem.id)]));

    expect(kept.map((one) => one.id)).toEqual(['b']);
  });
});
