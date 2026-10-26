import { asc, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import {
  collection,
  collectionEntry,
  favourite,
  library,
  mediaItem,
  mediaItemJob,
  rating,
  series,
  user,
  viewerProfile,
  watchHistory,
  watchProgress,
} from '#dialect/Schema';
import { createMediaStore, listOutstandingFor, markJobComplete } from './createMediaStore';
import type { MediaProbe } from '@ValenceServer/transcoder/TranscoderClient';
import type { MediaRow } from './scanLibrary';

const STARTING_POSTGRES_MS = 60_000;

const SHOWS_ID = '0b6f3a52-2a0c-4f7e-9d7b-1f3a7c2b8e11';

const PROBE: MediaProbe = {
  container: 'mkv',
  durationSeconds: 1800,
  bitrateKbps: 6000,
  canCopySegments: true,
  video: {
    index: 0,
    codec: 'h264',
    codecTag: null,
    width: 1920,
    height: 1080,
    range: 'SDR',
    rangeBase: 'SDR',
    bitrateKbps: 5500,
    bitDepth: 8,
    level: 41,
    frameRate: 23.976,
    isInterlaced: false,
    refFrames: 4,
    pixelAspect: null,
    rotationDegrees: null,
  },
  audioStreams: [],
  subtitleStreams: [],
  chapters: [],
};

/**
 * An episode of a programme kept in its own folder, as the scan would hand it over.
 *
 * @param path - Where its file is.
 * @param seriesTitle - What the programme is called.
 * @param externalId - The catalogue's id for the programme, where it was matched.
 * @returns The row.
 */
const anEpisode = (path: string, seriesTitle: string, externalId: string | null): MediaRow => ({
  libraryId: SHOWS_ID,
  path,
  title: 'Pilot',
  year: 2020,
  sizeBytes: 1,
  modifiedAtMs: 1,
  probe: PROBE,
  probeVersion: 1,
  metadata: {
    title: 'Pilot',
    year: 2020,
    seriesTitle,
    ...(externalId === null ? {} : { externalId }),
  },
  episode: {
    seriesTitle,
    seriesYear: null,
    seriesFolder: 'Show',
    seasonNumber: 1,
    episodeNumber: 1,
    episodeNumberEnd: null,
    episodeTitle: null,
    airDate: null,
  },
  extraKind: null,
  versionLabel: null,
});

/**
 * A media store over a fresh database holding one library of programmes.
 *
 * @returns The store and the database under it.
 */
const aStore = async () => {
  const db = await aMigratedDatabase();

  await db.insert(library).values({ id: SHOWS_ID, name: 'Shows', kind: 'shows', path: '/shows' });

  return { db, store: createMediaStore(db) };
};

describe('createMediaStore', { timeout: STARTING_POSTGRES_MS }, () => {
  it('keeps what is left out of a library once per path, and brings it back', async () => {
    const { store } = await aStore();
    const asked = {
      libraryId: SHOWS_ID,
      path: '/shows/Broken Show',
      isFolder: true,
      note: 'Every episode stutters',
      createdBy: null,
    };

    const first = await store.leaveOut(asked);
    const again = await store.leaveOut({ ...asked, note: 'A second note' });

    expect(first).toMatchObject({
      path: '/shows/Broken Show',
      isFolder: true,
      note: 'Every episode stutters',
    });
    expect(again?.id).toBe(first?.id);
    await expect(store.listLeftOut(SHOWS_ID)).resolves.toHaveLength(1);

    await expect(store.bringBack(SHOWS_ID, first?.id ?? '')).resolves.toMatchObject({
      path: '/shows/Broken Show',
    });
    await expect(store.listLeftOut(SHOWS_ID)).resolves.toEqual([]);
    await expect(store.bringBack(SHOWS_ID, first?.id ?? '')).resolves.toBeNull();
  });

  it('hands back the same id when a file is scanned again, and forgets what was done to it', async () => {
    const { db, store } = await aStore();
    const first = await store.upsert(anEpisode('/shows/Show/1.mkv', 'Show', null));

    await markJobComplete(db, first ?? '', 'preview');
    await markJobComplete(db, first ?? '', 'preview');

    expect(await db.select().from(mediaItemJob)).toHaveLength(1);

    const again = await store.upsert(anEpisode('/shows/Show/1.mkv', 'Show', null));

    expect(again).toBe(first);
    expect(await db.select().from(mediaItem)).toHaveLength(1);
    expect((await listOutstandingFor(db, SHOWS_ID, 'preview')).map((one) => one.id)).toEqual([
      first,
    ]);
  });

  it('keeps the lettering a scan found, and a lettering a later scan could not find again', async () => {
    const { db, store } = await aStore();
    const episode = anEpisode('/shows/Show/1.mkv', 'Show', 'tv:1');
    const lettered = {
      ...episode,
      metadata: { ...episode.metadata, logoUrl: 'https://logo/a.png' },
    };
    const logoOf = async () =>
      (await db.select({ logoUrl: mediaItem.logoUrl }).from(mediaItem))[0]?.logoUrl;

    await store.upsert(episode);

    expect(await logoOf()).toBeNull();

    await store.upsert(lettered);

    expect(await logoOf()).toBe('https://logo/a.png');

    await store.upsert(episode);

    expect(await logoOf()).toBe('https://logo/a.png');
  });

  it('names a programme after its catalogue match, and keeps that match once made', async () => {
    const { db, store } = await aStore();
    /**
     * Reads back every programme the library holds.
     *
     * @returns The programmes.
     */
    const seriesOf = async () => db.select().from(series);

    await store.upsert(anEpisode('/shows/Show/1.mkv', 'Show', null));
    expect(await seriesOf()).toMatchObject([{ title: 'Show', externalId: null }]);

    await store.upsert(anEpisode('/shows/Show/2.mkv', 'Show Proper', 'tv:1'));
    expect(await seriesOf()).toMatchObject([{ title: 'Show Proper', externalId: 'tv:1' }]);

    await store.upsert(anEpisode('/shows/Show/3.mkv', 'Another Show', 'tv:2'));
    expect(await seriesOf()).toMatchObject([{ title: 'Show Proper', externalId: 'tv:1' }]);

    await store.upsert(anEpisode('/shows/Show/4.mkv', 'Show Renamed', 'tv:1'));
    expect(await seriesOf()).toMatchObject([{ title: 'Show Renamed', externalId: 'tv:1' }]);

    const items = await db.select({ seriesId: mediaItem.seriesId }).from(mediaItem);

    expect(new Set(items.map((item) => item.seriesId)).size).toBe(1);
  });

  it('takes the catalogue match somebody corrected a programme to', async () => {
    const { db, store } = await aStore();

    await store.upsert(anEpisode('/shows/Show/1.mkv', 'Wrong Show', 'tv:1'));
    await store.upsert(anEpisode('/shows/Show/2.mkv', 'Show', 'tv:2'));
    expect(await db.select().from(series)).toMatchObject([
      { title: 'Wrong Show', externalId: 'tv:1' },
    ]);

    await store.upsert({ ...anEpisode('/shows/Show/1.mkv', 'Show', 'tv:2'), isCorrected: true });

    expect(await db.select().from(series)).toMatchObject([{ title: 'Show', externalId: 'tv:2' }]);
  });

  it('hands back what it removed, and counts what it cleared', async () => {
    const { db, store } = await aStore();

    await store.upsert(anEpisode('/shows/Show/1.mkv', 'Show', null));
    await store.upsert(anEpisode('/shows/Show/2.mkv', 'Show', null));

    const removed = await store.removeByPaths(SHOWS_ID, ['/shows/Show/1.mkv', '/shows/gone.mkv']);

    expect(removed).toMatchObject([{ title: 'Pilot', seriesTitle: 'Show' }]);
    expect(
      await db.select().from(mediaItem).where(eq(mediaItem.path, '/shows/Show/1.mkv')),
    ).toEqual([]);
    await expect(store.clear(SHOWS_ID)).resolves.toBe(1);
    await expect(store.clear(SHOWS_ID)).resolves.toBe(0);
  });

  it('keeps one override and one preview moment per file, and says whether one was removed', async () => {
    const { store } = await aStore();
    const override = {
      libraryId: SHOWS_ID,
      path: '/shows/Show/1.mkv',
      externalKind: 'tv',
      updatedBy: null,
    } as const;
    const moment = {
      libraryId: SHOWS_ID,
      path: '/shows/Show/1.mkv',
      durationSeconds: null,
      updatedBy: null,
    };

    await store.saveOverride({ ...override, externalId: 'tv:1' });
    await store.saveOverride({ ...override, externalId: 'tv:2' });

    await expect(store.listOverrides?.(SHOWS_ID)).resolves.toEqual([
      { path: '/shows/Show/1.mkv', externalId: 'tv:2', externalKind: 'tv' },
    ]);
    await expect(store.removeOverrides(SHOWS_ID, ['/shows/Show/1.mkv'])).resolves.toBe(1);
    await expect(store.removeOverrides(SHOWS_ID, ['/shows/Show/1.mkv'])).resolves.toBe(0);

    await store.savePreviewMoment({ ...moment, atSeconds: 10 });
    await store.savePreviewMoment({ ...moment, atSeconds: 20 });

    await expect(store.readPreviewMoment(SHOWS_ID, '/shows/Show/1.mkv')).resolves.toEqual({
      atSeconds: 20,
      durationSeconds: null,
    });
    await expect(store.removePreviewMoment(SHOWS_ID, '/shows/Show/1.mkv')).resolves.toBe(true);
    await expect(store.removePreviewMoment(SHOWS_ID, '/shows/Show/1.mkv')).resolves.toBe(false);
  });

  it('moves what viewers had of an episode onto the better copy that replaced it', async () => {
    const { db, store } = await aStore();
    const old = (await store.upsert(anEpisode('/shows/Show/1 WEBDL.mkv', 'Show', 'tv:1'))) ?? '';
    const better =
      (await store.upsert(anEpisode('/shows/Show/1 Bluray.mkv', 'Show', 'tv:1'))) ?? '';
    const at = new Date('2026-10-01T00:00:00.000Z');

    await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
    await db.insert(viewerProfile).values([
      { id: 'first', userId: 'ada', name: 'Ada', colour: 'pink' },
      { id: 'second', userId: 'ada', name: 'Bea', colour: 'blue' },
    ]);
    await db.insert(watchProgress).values([
      {
        id: 'p1',
        profileId: 'first',
        mediaItemId: old,
        positionSeconds: 1200,
        durationSeconds: 1800,
        isFinished: false,
        updatedAt: at,
      },
      {
        id: 'p2',
        profileId: 'second',
        mediaItemId: old,
        positionSeconds: 300,
        durationSeconds: 1800,
        isFinished: false,
        updatedAt: at,
      },
      {
        id: 'p3',
        profileId: 'second',
        mediaItemId: better,
        positionSeconds: 50,
        durationSeconds: 1800,
        isFinished: false,
        updatedAt: at,
      },
    ]);
    await db
      .insert(favourite)
      .values({ id: 'f1', profileId: 'first', mediaItemId: old, keptAt: at });
    await db.insert(watchHistory).values({
      id: 'h1',
      profileId: 'first',
      mediaItemId: old,
      startedAt: at,
      lastWatchedAt: at,
      secondsWatched: 1200,
      isFinished: false,
    });

    await store.removeByPaths(SHOWS_ID, ['/shows/Show/1 WEBDL.mkv']);

    await expect(
      db
        .select({
          profileId: watchProgress.profileId,
          mediaItemId: watchProgress.mediaItemId,
          positionSeconds: watchProgress.positionSeconds,
        })
        .from(watchProgress)
        .orderBy(asc(watchProgress.profileId)),
    ).resolves.toEqual([
      { profileId: 'first', mediaItemId: better, positionSeconds: 1200 },
      { profileId: 'second', mediaItemId: better, positionSeconds: 50 },
    ]);
    await expect(
      db.select({ mediaItemId: favourite.mediaItemId }).from(favourite),
    ).resolves.toEqual([{ mediaItemId: better }]);
    await expect(
      db.select({ mediaItemId: watchHistory.mediaItemId }).from(watchHistory),
    ).resolves.toEqual([{ mediaItemId: better }]);
  });

  it('keeps a film’s parts in order, and lets them go once it is one file again', async () => {
    const { store } = await aStore();
    const parts = [
      { path: '/shows/Show/1 - cd1.mkv', sizeBytes: 100, modifiedAtMs: 1, durationSeconds: 3000 },
      { path: '/shows/Show/1 - cd2.mkv', sizeBytes: 50, modifiedAtMs: 2, durationSeconds: 2400 },
    ];

    await store.upsert({ ...anEpisode('/shows/Show/1 - cd1.mkv', 'Show', 'tv:1'), parts });

    expect((await store.listStored(SHOWS_ID))[0]?.parts).toEqual([
      { path: '/shows/Show/1 - cd1.mkv', sizeBytes: 100, modifiedAtMs: 1 },
      { path: '/shows/Show/1 - cd2.mkv', sizeBytes: 50, modifiedAtMs: 2 },
    ]);

    await store.upsert({ ...anEpisode('/shows/Show/1 - cd1.mkv', 'Show', 'tv:1'), parts: [] });

    expect((await store.listStored(SHOWS_ID))[0]?.parts).toEqual([]);
  });

  it('sets aside a file gone with nothing to take its place, keeping what viewers have of it', async () => {
    const { db, store } = await aStore();
    const pilot = (await store.upsert(anEpisode('/shows/Show/1.mkv', 'Show', 'tv:1'))) ?? '';
    const second = anEpisode('/shows/Show/2.mkv', 'Show', 'tv:1');
    const gone =
      (await store.upsert({ ...second, episode: { ...second.episode, episodeNumber: 2 } })) ?? '';
    const at = new Date('2026-10-01T00:00:00.000Z');

    await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
    await db
      .insert(viewerProfile)
      .values({ id: 'first', userId: 'ada', name: 'Ada', colour: 'pink' });
    await db.insert(watchProgress).values({
      id: 'p1',
      profileId: 'first',
      mediaItemId: gone,
      positionSeconds: 600,
      durationSeconds: 1800,
      isFinished: false,
      updatedAt: at,
    });

    await expect(store.setAside(SHOWS_ID, ['/shows/Show/2.mkv'], at)).resolves.toEqual([]);

    const rows = await db
      .select({ id: mediaItem.id, missingSince: mediaItem.missingSince })
      .from(mediaItem)
      .orderBy(asc(mediaItem.path));

    expect(rows).toEqual([
      { id: pilot, missingSince: null },
      { id: gone, missingSince: at },
    ]);
    await expect(
      db.select({ mediaItemId: watchProgress.mediaItemId }).from(watchProgress),
    ).resolves.toEqual([{ mediaItemId: gone }]);
  });

  it('hands back a gone file another copy takes the place of, for removing', async () => {
    const { db, store } = await aStore();

    await store.upsert(anEpisode('/shows/Show/1 WEBDL.mkv', 'Show', 'tv:1'));
    await store.upsert(anEpisode('/shows/Show/1 Bluray.mkv', 'Show', 'tv:1'));

    await expect(
      store.setAside(SHOWS_ID, ['/shows/Show/1 WEBDL.mkv'], new Date('2026-10-01T00:00:00.000Z')),
    ).resolves.toEqual(['/shows/Show/1 WEBDL.mkv']);
    await expect(
      db.select({ missingSince: mediaItem.missingSince }).from(mediaItem),
    ).resolves.toEqual([{ missingSince: null }, { missingSince: null }]);
  });

  it('never hands a gone file’s viewers to another copy that is missing too', async () => {
    const { store } = await aStore();

    await store.upsert(anEpisode('/shows/Show/1 WEBDL.mkv', 'Show', 'tv:1'));
    await store.upsert(anEpisode('/shows/Show/1 Bluray.mkv', 'Show', 'tv:1'));
    await store.setAside(
      SHOWS_ID,
      ['/shows/Show/1 Bluray.mkv', '/shows/Show/1 WEBDL.mkv'],
      new Date(),
    );

    await expect(
      store.setAside(SHOWS_ID, ['/shows/Show/1 WEBDL.mkv'], new Date()),
    ).resolves.toEqual([]);
  });

  it('keeps the day a file first went missing, finds it again, and lists those long gone', async () => {
    const { store } = await aStore();
    const first = new Date('2026-09-01T00:00:00.000Z');

    await store.upsert(anEpisode('/shows/Show/1.mkv', 'Show', 'tv:1'));
    await store.setAside(SHOWS_ID, ['/shows/Show/1.mkv'], first);
    await store.setAside(SHOWS_ID, ['/shows/Show/1.mkv'], new Date('2026-10-20T00:00:00.000Z'));

    await expect(
      store.listMissingSince(SHOWS_ID, new Date('2026-09-02T00:00:00.000Z')),
    ).resolves.toEqual(['/shows/Show/1.mkv']);
    await expect(
      store.listMissingSince(SHOWS_ID, new Date('2026-08-31T00:00:00.000Z')),
    ).resolves.toEqual([]);

    await store.markFound(SHOWS_ID, ['/shows/Show/1.mkv']);

    await expect(
      store.listMissingSince(SHOWS_ID, new Date('2026-10-23T00:00:00.000Z')),
    ).resolves.toEqual([]);
  });

  it('keeps a version that takes its parent’s place, rather than removing it with the parent', async () => {
    const { db, store } = await aStore();
    const parent = (await store.upsert(anEpisode('/shows/Show/1 WEBDL.mkv', 'Show', 'tv:1'))) ?? '';
    const version =
      (await store.upsert(anEpisode('/shows/Show/1 Bluray.mkv', 'Show', 'tv:1'))) ?? '';

    await db
      .update(mediaItem)
      .set({ parentId: parent, versionLabel: 'Bluray' })
      .where(eq(mediaItem.id, version));
    await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
    await db
      .insert(viewerProfile)
      .values({ id: 'first', userId: 'ada', name: 'Ada', colour: 'pink' });
    await db.insert(watchProgress).values({
      id: 'p1',
      profileId: 'first',
      mediaItemId: parent,
      positionSeconds: 600,
      durationSeconds: 1800,
      isFinished: false,
      updatedAt: new Date('2026-10-01T00:00:00.000Z'),
    });

    await store.removeByPaths(SHOWS_ID, ['/shows/Show/1 WEBDL.mkv']);

    await expect(
      db.select({ id: mediaItem.id, parentId: mediaItem.parentId }).from(mediaItem),
    ).resolves.toEqual([{ id: version, parentId: null }]);
    await expect(
      db.select({ mediaItemId: watchProgress.mediaItemId }).from(watchProgress),
    ).resolves.toEqual([{ mediaItemId: version }]);
  });

  it('gathers a programme split across two into the one matched to the catalogue, keeping one rating each', async () => {
    const { db, store } = await aStore();
    const one = await store.upsert(anEpisode('/shows/Show/1.mkv', 'Show', null));
    const two = await store.upsert(anEpisode('/shows/Show/2.mkv', 'Show', null));

    await db.insert(series).values([
      {
        id: 'matched',
        libraryId: SHOWS_ID,
        key: 'catalogue:tv:1',
        title: 'Show',
        externalId: 'tv:1',
      },
      { id: 'by-title', libraryId: SHOWS_ID, key: 'title:show', title: 'Show' },
    ]);
    await db
      .update(mediaItem)
      .set({ seriesId: 'matched' })
      .where(eq(mediaItem.id, one ?? ''));
    await db
      .update(mediaItem)
      .set({ seriesId: 'by-title' })
      .where(eq(mediaItem.id, two ?? ''));
    await store.forgetEmptySeries?.(SHOWS_ID);
    await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
    await db.insert(viewerProfile).values([
      { id: 'first', userId: 'ada', name: 'Ada', colour: 'pink' },
      { id: 'second', userId: 'ada', name: 'Bea', colour: 'blue' },
    ]);
    await db.insert(rating).values([
      { id: 'kept', profileId: 'first', seriesId: 'matched', stars: 5 },
      { id: 'twice', profileId: 'first', seriesId: 'by-title', stars: 3 },
      { id: 'moved', profileId: 'second', seriesId: 'by-title', stars: 4 },
    ]);

    await store.regroupSeries?.(
      SHOWS_ID,
      new Map([
        ['/shows/Show/1.mkv', '/shows/Show'],
        ['/shows/Show/2.mkv', '/shows/Show'],
      ]),
    );

    await expect(db.select({ id: series.id, key: series.key }).from(series)).resolves.toEqual([
      { id: 'matched', key: 'folder:/shows/Show' },
    ]);
    await expect(
      db.select({ id: rating.id, seriesId: rating.seriesId }).from(rating).orderBy(asc(rating.id)),
    ).resolves.toEqual([
      { id: 'kept', seriesId: 'matched' },
      { id: 'moved', seriesId: 'matched' },
    ]);
  });

  it('keeps a programme in its collections when it is gathered into another, once in each', async () => {
    const { db, store } = await aStore();
    const one = await store.upsert(anEpisode('/shows/Show/1.mkv', 'Show', null));
    const two = await store.upsert(anEpisode('/shows/Show/2.mkv', 'Show', null));

    await db.insert(series).values([
      {
        id: 'matched',
        libraryId: SHOWS_ID,
        key: 'catalogue:tv:1',
        title: 'Show',
        externalId: 'tv:1',
      },
      { id: 'by-title', libraryId: SHOWS_ID, key: 'title:show', title: 'Show' },
    ]);
    await db
      .update(mediaItem)
      .set({ seriesId: 'matched' })
      .where(eq(mediaItem.id, one ?? ''));
    await db
      .update(mediaItem)
      .set({ seriesId: 'by-title' })
      .where(eq(mediaItem.id, two ?? ''));
    await db.insert(collection).values([
      { id: 'both', name: 'Both' },
      { id: 'only-the-other', name: 'Only the other' },
    ]);
    await db.insert(collectionEntry).values([
      { id: 'kept', collectionId: 'both', seriesId: 'matched', position: 1 },
      { id: 'twice', collectionId: 'both', seriesId: 'by-title', position: 2 },
      { id: 'moved', collectionId: 'only-the-other', seriesId: 'by-title', position: 1 },
    ]);

    await store.regroupSeries?.(
      SHOWS_ID,
      new Map([
        ['/shows/Show/1.mkv', '/shows/Show'],
        ['/shows/Show/2.mkv', '/shows/Show'],
      ]),
    );

    await expect(
      db
        .select({ id: collectionEntry.id, seriesId: collectionEntry.seriesId })
        .from(collectionEntry)
        .orderBy(asc(collectionEntry.id)),
    ).resolves.toEqual([
      { id: 'kept', seriesId: 'matched' },
      { id: 'moved', seriesId: 'matched' },
    ]);
  });

  it('lets go of a version whose film turned out to be a different one', async () => {
    const { db, store } = await aStore();
    const film = await store.upsert(anEpisode('/shows/film.mkv', 'Show', null));
    const same = await store.upsert(anEpisode('/shows/film-4k.mkv', 'Show', null));
    const other = await store.upsert(anEpisode('/shows/film-other.mkv', 'Show', null));

    await db
      .update(mediaItem)
      .set({ externalId: 'tmdb:1' })
      .where(eq(mediaItem.id, film ?? ''));
    await db
      .update(mediaItem)
      .set({ externalId: 'tmdb:1', parentId: film })
      .where(eq(mediaItem.id, same ?? ''));
    await db
      .update(mediaItem)
      .set({ externalId: 'tmdb:2', parentId: film })
      .where(eq(mediaItem.id, other ?? ''));

    await store.forgetStaleVersions?.(SHOWS_ID, []);

    const parents = await db
      .select({ id: mediaItem.id, parentId: mediaItem.parentId })
      .from(mediaItem);

    expect(parents.find((row) => row.id === same)?.parentId).toBe(film);
    expect(parents.find((row) => row.id === other)?.parentId).toBeNull();
  });
});
