import { describe, expect, it } from 'vitest';
import { library, mediaItem } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createDatabaseLikenessStore } from './createDatabaseLikenessStore';

const STARTING_POSTGRES_MS = 60_000;

const NOTHING_ALIKE = { genres: [], keywords: [], cast: [], crew: [], recommendations: [] };

describe('createDatabaseLikenessStore', { timeout: STARTING_POSTGRES_MS }, () => {
  it('lists each film and programme the libraries hold once, by its catalogue identifier', async () => {
    const { db } = await aHousehold();

    await db.insert(library).values({ id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' });
    await db.insert(mediaItem).values([
      { ...aMediaItemRow('matrix', 'films'), path: '/films/matrix.mkv', externalId: '603' },
      {
        ...aMediaItemRow('one', 'shows'),
        path: '/shows/one.mkv',
        seriesTitle: 'Severance',
        externalId: '95396',
      },
      {
        ...aMediaItemRow('two', 'shows'),
        path: '/shows/two.mkv',
        seriesTitle: 'Severance',
        externalId: '95396',
      },
      {
        ...aMediaItemRow('gone', 'films'),
        path: '/films/gone.mkv',
        externalId: '604',
        missingSince: new Date(),
      },
      {
        ...aMediaItemRow('trailer', 'films'),
        path: '/films/trailer.mkv',
        externalId: '605',
        extraKind: 'trailer',
      },
      { ...aMediaItemRow('odd', 'films'), path: '/films/odd.mkv', externalId: 'tt0133093' },
    ]);

    const store = createDatabaseLikenessStore(db);

    expect(await store.waiting(new Date())).toEqual([
      { kind: 'film', catalogueId: '603' },
      { kind: 'series', catalogueId: '95396' },
    ]);
  });

  it('keeps what a title is like, and lists it again only once that reading is older than asked', async () => {
    const { db } = await aHousehold();

    await db.insert(mediaItem).values({
      ...aMediaItemRow('matrix', 'films'),
      path: '/films/matrix.mkv',
      externalId: '603',
    });

    const store = createDatabaseLikenessStore(db);
    const readAt = new Date('2026-10-01T00:00:00.000Z');
    const likeness = { genres: [878], keywords: [1], cast: [2], crew: [3], recommendations: [604] };

    await store.keep({ kind: 'film', catalogueId: '603' }, NOTHING_ALIKE, readAt);
    await store.keep({ kind: 'film', catalogueId: '603' }, likeness, readAt);

    expect(await store.readAll()).toEqual([{ kind: 'film', catalogueId: '603', likeness }]);
    expect(await store.waiting(readAt)).toEqual([]);
    expect(await store.waiting(new Date('2026-10-02T00:00:00.000Z'))).toEqual([
      { kind: 'film', catalogueId: '603' },
    ]);
  });

  it('reads a film and a programme sharing an identifier as two titles', async () => {
    const { db } = await aHousehold();
    const store = createDatabaseLikenessStore(db);
    const readAt = new Date('2026-10-01T00:00:00.000Z');

    await store.keep({ kind: 'film', catalogueId: '1' }, NOTHING_ALIKE, readAt);
    await store.keep(
      { kind: 'series', catalogueId: '1' },
      { ...NOTHING_ALIKE, keywords: [9] },
      readAt,
    );

    expect(
      (await store.readAll()).map((one) => [one.kind, one.likeness.keywords]).toSorted(),
    ).toEqual([
      ['film', []],
      ['series', [9]],
    ]);
  });

  it('forgets titles no library holds any longer', async () => {
    const { db } = await aHousehold();

    await db.insert(mediaItem).values({
      ...aMediaItemRow('matrix', 'films'),
      path: '/films/matrix.mkv',
      externalId: '603',
    });

    const store = createDatabaseLikenessStore(db);
    const readAt = new Date('2026-10-01T00:00:00.000Z');

    await store.keep({ kind: 'film', catalogueId: '603' }, NOTHING_ALIKE, readAt);
    await store.keep({ kind: 'series', catalogueId: '603' }, NOTHING_ALIKE, readAt);
    await store.keep({ kind: 'film', catalogueId: '604' }, NOTHING_ALIKE, readAt);
    await store.forgetUnheld();

    expect((await store.readAll()).map((one) => [one.kind, one.catalogueId])).toEqual([
      ['film', '603'],
    ]);
  });
});
