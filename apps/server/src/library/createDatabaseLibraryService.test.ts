import { describe, expect, it, vi } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, rating, series, user, viewerProfile } from '#dialect/Schema';
import { createDatabaseLibraryService } from './createDatabaseLibraryService';
import type { JobQueue } from '@ValenceServer/jobs/JobQueue';
import type { Transcoder } from '@ValenceServer/transcoder/TranscoderClient';

const STARTING_POSTGRES_MS = 60_000;

const SERVER = { kind: 'server' } as const;

const FILMS_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

const SHOWS_ID = '0b6f3a52-2a0c-4f7e-9d7b-1f3a7c2b8e11';

const NOT_USED = (): Promise<never> => Promise.reject(new Error('not used'));

const TRANSCODER: Transcoder = {
  isReachable: () => Promise.resolve(true),
  measureCache: () => Promise.resolve(null),
  sweepPreviews: NOT_USED,
  forgetPreview: NOT_USED,
  requestDownload: NOT_USED,
  requestRendition: NOT_USED,
  stopRendition: () => Promise.resolve(false),
  forgetRendition: () => Promise.resolve(false),
  readDownloadFile: NOT_USED,
  stopDownload: NOT_USED,
  forgetDownload: NOT_USED,
  forgetTrickplay: NOT_USED,
  sweepTrickplay: NOT_USED,
  probe: NOT_USED,
  startSession: NOT_USED,
  readSessionFile: () => Promise.resolve(null),
  readFile: () => Promise.resolve(null),
  readAudioRendition: () => Promise.resolve(null),
  fingerprint: NOT_USED,
  requestTrickplay: NOT_USED,
  readTrickplayFile: () => Promise.resolve(null),
  stopSession: () => Promise.resolve(true),
  heartbeatSession: () => Promise.resolve(true),
  readSubtitle: NOT_USED,
  readFrame: NOT_USED,
  requestPreview: NOT_USED,
  readPreviewFile: () => Promise.resolve(null),
  readMonitor: () => Promise.resolve({}),
  openMonitorSocket: () => Promise.resolve(null),
  capabilities: NOT_USED,
};

const JOBS: JobQueue = {
  startWorking: () => Promise.resolve(),
  enqueue: () => Promise.resolve(null),
  enqueueAfter: () => Promise.resolve(null),
  readState: NOT_USED,
  readProgress: () => null,
  reportProgress: () => undefined,
  listRunning: () => [],
  liveJob: () => Promise.resolve(null),
  cancel: () => Promise.resolve(false),
  cancelFor: () => Promise.resolve(0),
  isCancelled: () => false,
  setSchedule: () => Promise.resolve(),
  clearSchedule: () => Promise.resolve(),
  listSchedules: () => Promise.resolve([]),
  stop: () => Promise.resolve(),
};

/**
 * A film as the scan would store it, with whatever the test cares about on top.
 *
 * @param id - The film.
 * @param title - What it is called.
 * @param extra - Anything else about it.
 * @returns The row.
 */
const aFilm = (
  id: string,
  title: string,
  extra: Partial<typeof mediaItem.$inferInsert> = {},
): typeof mediaItem.$inferInsert => ({
  id,
  libraryId: FILMS_ID,
  path: `/films/${id}.mkv`,
  title,
  sizeBytes: 1,
  modifiedAtMs: 1,
  container: 'mkv',
  durationSeconds: 60,
  videoCodec: 'h264',
  videoRange: 'sdr',
  width: 1920,
  height: 1080,
  audioStreams: [],
  subtitleStreams: [],
  ...extra,
});

/**
 * A library service over a fresh database holding a library of three films, a second version of
 * one of them, and an account whose profile has rated one.
 *
 * @returns The service and the database under it.
 */
const aLibrary = async () => {
  const db = await aMigratedDatabase();

  await db.insert(user).values({ id: 'ada', name: 'Ada', email: 'ada@example.com' });
  await db
    .insert(viewerProfile)
    .values({ id: 'watcher', userId: 'ada', name: 'Ada', colour: 'pink' });
  await db.insert(library).values([
    { id: FILMS_ID, name: 'Films', kind: 'movies', path: '/films' },
    { id: SHOWS_ID, name: 'Shows', kind: 'shows', path: '/shows' },
  ]);
  await db.insert(series).values({ id: 'a-show', libraryId: SHOWS_ID, key: 'show', title: 'Show' });
  await db.insert(mediaItem).values([
    aFilm('arrival', 'Arrival', {
      year: 2016,
      rating: 7.9,
      genres: ['Drama', 'Science Fiction'],
      castMembers: [{ personId: 1, name: 'Amy Adams', character: 'Louise' }],
    }),
    aFilm('alien', 'Alien', {
      year: 1979,
      rating: 8.5,
      genres: ['Horror', 'Science Fiction'],
      tagline: 'In space no one can hear you scream.',
    }),
    aFilm('brazil', 'Brazil', { year: 1985, genres: ['Comedy'] }),
    aFilm('alien-cut', 'Alien', { parentId: 'alien' }),
  ]);
  await db.insert(rating).values({
    id: 'a-rating',
    profileId: 'watcher',
    mediaItemId: 'brazil',
    stars: 4,
  });

  const service = createDatabaseLibraryService({
    db,
    files: { listFiles: NOT_USED },
    transcoder: TRANSCODER,
    jobs: JOBS,
  });

  return { db, service };
};

/**
 * Lists the titles of a library's page of films.
 *
 * @param found - What the service answered.
 * @returns The titles, in order.
 */
const titlesIn = (found: { items: { title: string }[] } | null): string[] =>
  found?.items.map((item) => item.title) ?? [];

describe('the release calendar', { timeout: STARTING_POSTGRES_MS }, () => {
  /**
   * A library holding the first two episodes of a show's second season, over a catalogue that
   * knows the season runs to three.
   *
   * @returns The service and what the catalogue was asked.
   */
  const aShowAiring = async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values({ id: SHOWS_ID, name: 'Shows', kind: 'shows', path: '/shows' });
    await db
      .insert(series)
      .values({ id: 'a-show', libraryId: SHOWS_ID, key: 'show', title: 'Show' });
    await db.insert(mediaItem).values(
      [1, 2].map((episodeNumber) =>
        aFilm(`episode-${episodeNumber.toString()}`, `Episode ${episodeNumber.toString()}`, {
          libraryId: SHOWS_ID,
          path: `/shows/show/s02e0${episodeNumber.toString()}.mkv`,
          seriesId: 'a-show',
          seriesTitle: 'Show',
          seasonNumber: 2,
          episodeNumber,
          externalId: '300',
        }),
      ),
    );

    const describeAiringSeason = vi.fn(() =>
      Promise.resolve({
        seasonNumber: 2,
        episodes: [
          { episodeNumber: 1, title: 'One', airDate: '2026-09-28', stillUrl: null },
          { episodeNumber: 2, title: 'Two', airDate: '2026-10-05', stillUrl: '/two.jpg' },
          { episodeNumber: 3, title: 'Three', airDate: '2026-10-12', stillUrl: null },
        ],
      }),
    );

    const service = createDatabaseLibraryService({
      db,
      files: { listFiles: NOT_USED },
      transcoder: TRANSCODER,
      jobs: JOBS,
      providers: [{ name: 'catalogue', describe: NOT_USED, describeAiringSeason }],
    });

    return { service, describeAiringSeason };
  };

  it('lists the episodes airing in the days asked about, saying which are on disk', async () => {
    const { service } = await aShowAiring();

    const episodes = await service.releaseCalendar(SERVER, '2026-10-01', '2026-10-31');

    expect(
      episodes.map((episode) => [
        episode.externalId,
        episode.seasonNumber,
        episode.episodeNumber,
        episode.airDate,
        episode.isHeld,
        episode.stillUrl,
      ]),
    ).toEqual([
      ['300', 2, 2, '2026-10-05', true, '/two.jpg'],
      ['300', 2, 3, '2026-10-12', false, null],
    ]);
    expect(episodes[0]?.show).toMatchObject({ title: 'Show', seriesId: 'a-show' });
  });

  it('names the stills of the episodes a series in the catalogue is airing', async () => {
    const { service, describeAiringSeason } = await aShowAiring();

    const stills = await service.airingStills(['300', '300']);

    expect([...stills]).toEqual([['tv:300:s2e2', '/two.jpg']]);
    expect(describeAiringSeason).toHaveBeenCalledTimes(1);
  });

  it('reads a title’s backdrop and logo from the catalogue once, however often it is asked', async () => {
    const db = await aMigratedDatabase();
    const describeTitle = vi.fn(() =>
      Promise.resolve({
        title: 'A Film',
        year: 2026,
        overview: null,
        posterUrl: null,
        backdropUrl: '/backdrop.jpg',
        genres: [],
        runtimeMinutes: null,
        cast: [],
        trailerKey: null,
      }),
    );
    const readLogoUrl = vi.fn(() => Promise.resolve('/logo.png'));
    const service = createDatabaseLibraryService({
      db,
      files: { listFiles: NOT_USED },
      transcoder: TRANSCODER,
      jobs: JOBS,
      providers: [{ name: 'catalogue', describe: NOT_USED, describeTitle, readLogoUrl }],
    });

    const title = { kind: 'movie' as const, externalId: '100' };

    expect([...(await service.catalogueArtwork([title, title]))]).toEqual([
      ['movie:100', { backdropUrl: '/backdrop.jpg', logoUrl: '/logo.png' }],
    ]);
    await service.catalogueArtwork([title]);
    expect(describeTitle).toHaveBeenCalledTimes(1);
    expect(readLogoUrl).toHaveBeenCalledWith({ externalId: '100', isSeries: false });
  });

  it('asks the catalogue about a show once, however often the calendar is read', async () => {
    const { service, describeAiringSeason } = await aShowAiring();

    await service.releaseCalendar(SERVER, '2026-10-01', '2026-10-31');
    await service.releaseCalendar(SERVER, '2026-09-01', '2026-09-30');

    expect(describeAiringSeason).toHaveBeenCalledOnce();
  });
});

describe('createDatabaseLibraryService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('counts the films in a library once each, whatever versions they come in', async () => {
    const { service } = await aLibrary();

    expect((await service.list(SERVER)).map((one) => [one.name, one.itemCount])).toEqual(
      expect.arrayContaining([
        ['Films', 3],
        ['Shows', 0],
      ]),
    );
  });

  it('finds a film by its title, tagline or cast whatever the case', async () => {
    const { service } = await aLibrary();
    /**
     * Searches the films.
     *
     * @param words - What was typed.
     * @returns What was found.
     */
    const search = (words: string) =>
      service.listItems(SERVER, FILMS_ID, { search: words, limit: 10, offset: 0 });

    expect(titlesIn(await search('ARRIV'))).toEqual(['Arrival']);
    expect(titlesIn(await search('no one can HEAR'))).toEqual(['Alien']);
    expect(titlesIn(await search('amy adams'))).toEqual(['Arrival']);
    expect(titlesIn(await search('nobody'))).toEqual([]);
  });

  it('filters by a genre, and counts what matched', async () => {
    const { service } = await aLibrary();
    const found = await service.listItems(SERVER, FILMS_ID, {
      genre: 'Science Fiction',
      limit: 1,
      offset: 0,
    });

    expect(found?.total).toBe(2);
    expect(titlesIn(found)).toEqual(['Alien']);
  });

  it('puts what the profile rated first and the unrated after, by title', async () => {
    const { service } = await aLibrary();
    const found = await service.listItems(SERVER, FILMS_ID, {
      order: 'yourRating',
      profileId: 'watcher',
      limit: 10,
      offset: 0,
    });

    expect(titlesIn(found)).toEqual(['Brazil', 'Alien', 'Arrival']);
  });

  it('offers each genre and decade once, in order, and the best rating', async () => {
    const { service } = await aLibrary();

    await expect(service.listFacets(SERVER)).resolves.toEqual({
      genres: ['Comedy', 'Drama', 'Horror', 'Science Fiction'],
      decades: [2010, 1980, 1970],
      maxRating: 8.5,
    });
  });

  it('finds what a person was in', async () => {
    const { service } = await aLibrary();

    expect((await service.findByPerson(SERVER, 1)).map((item) => item.title)).toEqual(['Arrival']);
    await expect(service.findByPerson(SERVER, 2)).resolves.toEqual([]);
  });

  it('refuses a library once however often it is refused', async () => {
    const { service } = await aLibrary();

    await service.refuseLibrary('ada', FILMS_ID);
    await service.refuseLibrary('ada', FILMS_ID);

    await expect(service.refusedLibraries('ada')).resolves.toEqual([FILMS_ID]);
  });

  it('keeps one ceiling per library, the one set last', async () => {
    const { service } = await aLibrary();

    await service.setCeiling('ada', { libraryId: FILMS_ID, maximumAge: 12, allowsUnrated: true });
    await service.setCeiling('ada', { libraryId: FILMS_ID, maximumAge: 15, allowsUnrated: false });

    await expect(service.ceilingsFor('ada')).resolves.toEqual([
      { libraryId: FILMS_ID, maximumAge: 15, allowsUnrated: false },
    ]);
  });

  it('keeps one exception per film or show, the one set last, and says whether one was cleared', async () => {
    const { service } = await aLibrary();
    const film = { kind: 'item', subjectId: 'arrival' } as const;
    const show = { kind: 'series', subjectId: 'a-show' } as const;

    await expect(service.setException('ada', film, 'allow', null)).resolves.toBe(true);
    await expect(service.setException('ada', film, 'deny', null)).resolves.toBe(true);
    await expect(service.setException('ada', show, 'allow', null)).resolves.toBe(true);
    await expect(service.setException('ada', show, 'deny', null)).resolves.toBe(true);

    await expect(service.exceptionsOn(film)).resolves.toEqual([
      { accountId: 'ada', effect: 'deny' },
    ]);
    await expect(service.exceptionsOn(show)).resolves.toEqual([
      { accountId: 'ada', effect: 'deny' },
    ]);

    await expect(service.clearException('ada', film)).resolves.toBe(true);
    await expect(service.clearException('ada', film)).resolves.toBe(false);
  });
});

describe('leaving files out of a library', { timeout: STARTING_POSTGRES_MS }, () => {
  /**
   * The library of films, its files on the disk exactly as stored, so a scan has nothing to read
   * again and only what it is told to leave out changes.
   *
   * @param alsoOnDisk - Files on the disk the database has not seen.
   * @param transcoder - What reads a file, where a test watches it.
   * @returns The service and the database under it.
   */
  const aLibraryOnDisk = async (alsoOnDisk: string[] = [], transcoder: Transcoder = TRANSCODER) => {
    const { db } = await aLibrary();
    const onDisk = [
      ...['arrival', 'alien', 'brazil', 'alien-cut'].map((id) => `/films/${id}.mkv`),
      ...alsoOnDisk,
    ].map((path) => ({ path, sizeBytes: 1, modifiedAtMs: 1 }));
    const service = createDatabaseLibraryService({
      db,
      files: { listFiles: () => Promise.resolve({ files: onDisk, unreadable: [] }) },
      transcoder,
      jobs: JOBS,
    });

    return { db, service };
  };

  it('takes a file out at the next scan, and keeps it out', async () => {
    const { db, service } = await aLibraryOnDisk();

    const left = await service.leaveOut(
      FILMS_ID,
      { path: '/films/brazil.mkv', note: 'The sound drifts' },
      null,
    );

    expect(left).toMatchObject({
      kind: 'left',
      leftOut: { path: '/films/brazil.mkv', isFolder: false, note: 'The sound drifts' },
    });

    await service.runScan(FILMS_ID);

    const stored = await db.select({ id: mediaItem.id }).from(mediaItem);

    expect(stored.map((row) => row.id).sort()).toEqual(['alien', 'alien-cut', 'arrival']);
    await expect(service.listLeftOut(FILMS_ID)).resolves.toHaveLength(1);
  });

  it('leaves everything inside a folder out, and nothing that only starts with its name', async () => {
    const probe = vi.fn<Transcoder['probe']>(NOT_USED);
    const { db, service } = await aLibraryOnDisk(
      ['/films/Behind the Scenes/Making of.mkv', '/films/Behind the Scenes/Bloopers.mkv'],
      { ...TRANSCODER, probe },
    );

    await service.leaveOut(FILMS_ID, { path: '/films/Behind the Scenes/', note: null }, null);
    await service.leaveOut(FILMS_ID, { path: '/films/alien', note: null }, null);
    await service.runScan(FILMS_ID);

    const stored = await db.select({ id: mediaItem.id }).from(mediaItem);

    expect(probe.mock.calls.flat().filter((path) => path.includes('Behind the Scenes'))).toEqual(
      [],
    );
    expect(probe.mock.calls.length).toBeGreaterThan(0);
    expect(stored.map((row) => row.id).sort()).toEqual(['alien', 'alien-cut', 'arrival', 'brazil']);
    await expect(service.listLeftOut(FILMS_ID)).resolves.toMatchObject([
      { path: '/films/Behind the Scenes' },
      { path: '/films/alien' },
    ]);
  });

  it('refuses a path outside the library, or the library itself', async () => {
    const { service } = await aLibraryOnDisk();

    await expect(
      service.leaveOut(FILMS_ID, { path: '/elsewhere/film.mkv', note: null }, null),
    ).resolves.toEqual({ kind: 'outside' });
    await expect(service.leaveOut(FILMS_ID, { path: '/films', note: null }, null)).resolves.toEqual(
      { kind: 'outside' },
    );
    await expect(
      service.leaveOut(
        '9d1b6a52-0000-4f7e-9d7b-1f3a7c2b8e11',
        { path: '/films/a.mkv', note: null },
        null,
      ),
    ).resolves.toEqual({ kind: 'noLibrary' });
  });

  it('brings a file back, so the next scan can find it again', async () => {
    const { service } = await aLibraryOnDisk();
    const left = await service.leaveOut(FILMS_ID, { path: '/films/brazil.mkv', note: null }, null);
    const id = left.kind === 'left' ? left.leftOut.id : '';

    await expect(service.bringBack(FILMS_ID, id)).resolves.toMatchObject({
      leftOut: { path: '/films/brazil.mkv' },
    });
    await expect(service.listLeftOut(FILMS_ID)).resolves.toEqual([]);
    await expect(service.bringBack(FILMS_ID, id)).resolves.toBeNull();
  });
});
