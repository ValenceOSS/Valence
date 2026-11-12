import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diskPictureAddress } from './diskPictureAddress';
import { describe, expect, it, vi } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createArtworkChoices } from './createArtworkChoices';
import type { ArtworkChoices } from '@ValenceContracts/schemas/ArtworkChoice';

const STARTING_THE_DATABASE_MS = 60_000;

const BASE = 'https://image.tmdb.org/t/p';

const option = (path: string) => ({
  url: `${BASE}/original${path}`,
  previewUrl: `${BASE}/w500${path}`,
  language: 'en',
  width: 1000,
  height: 400,
  votes: 1,
});

const OFFERED: ArtworkChoices['options'] = {
  poster: [option('/poster-a.jpg'), option('/poster-b.jpg')],
  backdrop: [option('/backdrop-a.jpg')],
  logo: [option('/logo-a.png')],
};

const OWN = {
  poster: { url: `${BASE}/w500/own-poster.jpg`, previewUrl: `${BASE}/w342/own-poster.jpg` },
  backdrop: {
    url: `${BASE}/w1280/own-backdrop.jpg`,
    previewUrl: `${BASE}/w780/own-backdrop.jpg`,
  },
  logo: null,
};

/**
 * A migrated database holding a programme of two episodes, a film, a file the catalogue never
 * matched, and no choices yet.
 *
 * @returns The database.
 */
const aScratchDatabase = async () => {
  const db = await aMigratedDatabase();
  const episode = { seriesTitle: 'A Show', externalId: '100', posterUrl: 'p.jpg' };

  await db.insert(library).values([
    { id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' },
    { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
  ]);
  await db.insert(mediaItem).values([
    {
      ...aMediaItemRow('ep-1', 'shows'),
      ...episode,
      path: '/shows/a/1.mkv',
      backdropUrl: 'still-1.jpg',
    },
    {
      ...aMediaItemRow('ep-2', 'shows'),
      ...episode,
      path: '/shows/a/2.mkv',
      backdropUrl: 'still-2.jpg',
    },
    {
      ...aMediaItemRow('film', 'films'),
      path: '/films/f.mkv',
      externalId: '100',
      posterUrl: 'fp.jpg',
      backdropUrl: 'fb.jpg',
      logoUrl: 'fl.png',
    },
    { ...aMediaItemRow('stray', 'films'), path: '/films/s.mkv' },
  ]);

  return db;
};

/**
 * Builds the choices over a scratch database, with a catalogue that offers the pictures above and
 * work that records what it was asked to do.
 *
 * @returns The choices, a way to read a picture column back, and what was asked of the library.
 */
const someChoices = async () => {
  const db = await aScratchDatabase();
  const readAgain = vi.fn(() => Promise.resolve('read-again-job'));
  const fetchLogos = vi.fn(() => Promise.resolve({ jobId: 'logos-job' }));
  const choices = createArtworkChoices({
    db,
    readOptions: () => Promise.resolve(OFFERED),
    readAgain,
    fetchLogos,
  });
  const column = async (id: string, name: 'posterUrl' | 'backdropUrl' | 'logoUrl') =>
    (await db.select().from(mediaItem).where(eq(mediaItem.id, id)))[0]?.[name] ?? null;

  return { choices, readAgain, fetchLogos, column };
};

describe('createArtworkChoices', { timeout: STARTING_THE_DATABASE_MS }, () => {
  it('offers what the catalogue has, and what is chosen now', async () => {
    const { choices } = await someChoices();

    const read = await choices.read('ep-1');

    expect(read).toEqual({
      kind: 'tv',
      options: OFFERED,
      onDisk: [],
      chosen: { poster: null, backdrop: null, logo: null },
      defaults: { poster: null, backdrop: null, logo: null },
    });
  });

  it('offers the pictures beside a film’s file, and chooses one without asking the catalogue', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-artwork-'));
    const db = await aScratchDatabase();

    await writeFile(join(folder, 'poster.jpg'), 'a');
    await writeFile(join(folder, 'notes.txt'), 'b');
    await db
      .update(mediaItem)
      .set({ path: join(folder, 'f.mkv') })
      .where(eq(mediaItem.id, 'film'));

    const readOptions = vi.fn(() => Promise.resolve(OFFERED));
    const choices = createArtworkChoices({
      db,
      readOptions,
      readAgain: () => Promise.resolve(null),
      fetchLogos: () => Promise.resolve(null),
    });
    const read = await choices.read('film');
    const [onDisk] = typeof read === 'string' ? [] : read.onDisk;

    expect(onDisk).toEqual({
      url: diskPictureAddress(join(folder, 'poster.jpg')),
      name: 'poster.jpg',
    });

    readOptions.mockClear();

    await expect(choices.choose('film', 'poster', onDisk?.url ?? '', null)).resolves.toEqual({
      jobId: null,
    });
    expect(readOptions).not.toHaveBeenCalled();
    await expect(choices.isOwnPicture('film', onDisk?.url ?? '')).resolves.toBe(true);
    await expect(
      choices.isOwnPicture('film', diskPictureAddress(join(folder, 'notes.txt'))),
    ).resolves.toBe(false);
  });

  it('chooses an episode’s still and a season’s poster from the catalogue’s, and goes back', async () => {
    const db = await aScratchDatabase();

    await db
      .update(mediaItem)
      .set({ seasonNumber: 1, episodeNumber: 1 })
      .where(eq(mediaItem.id, 'ep-1'));
    await db
      .update(mediaItem)
      .set({ seasonNumber: 1, episodeNumber: 2 })
      .where(eq(mediaItem.id, 'ep-2'));

    const stills = [option('/still-a.jpg'), option('/still-b.jpg')];
    const readAgain = vi.fn(() => Promise.resolve('job'));
    const choices = createArtworkChoices({
      db,
      readOptions: () => Promise.resolve(OFFERED),
      readPartOptions: () => Promise.resolve(stills),
      readAgain,
      fetchLogos: () => Promise.resolve(null),
    });
    const still = stills[1]?.url ?? '';
    const column = async (id: string) =>
      (await db.select().from(mediaItem).where(eq(mediaItem.id, id)))[0]?.backdropUrl ?? null;

    await expect(
      choices.choosePart('ep-1', { season: 1, episode: 1 }, `${BASE}/elsewhere.jpg`, null),
    ).resolves.toBe('refused');
    await expect(
      choices.choosePart('ep-1', { season: 1, episode: 1 }, still, null),
    ).resolves.toEqual({
      jobId: null,
    });

    expect(await column('ep-1')).toBe(still);
    expect(await column('ep-2')).toBe('still-2.jpg');
    await expect(choices.urlFor('ep-1', 'backdrop', false)).resolves.toBe(still);

    await choices.choosePart('ep-1', { season: 1, episode: null }, still, null);

    expect((await choices.partsChosen('shows', '100')).get('poster:s1')).toBe(still);

    await expect(
      choices.choosePart('ep-1', { season: 1, episode: 1 }, null, null),
    ).resolves.toEqual({
      jobId: 'job',
    });
    await expect(choices.urlFor('ep-1', 'backdrop', false)).resolves.toBeNull();
  });

  it(
    'asks for a season’s pictures from the show it is read from, where it is another’s',
    async () => {
      const db = await aScratchDatabase();

      await db
        .update(mediaItem)
        .set({ seasonNumber: 7, episodeNumber: 1 })
        .where(eq(mediaItem.id, 'ep-1'));

      const readPartOptions = vi.fn(() => Promise.resolve([option('/revival.jpg')]));
      const choices = createArtworkChoices({
        db,
        readOptions: () => Promise.resolve(OFFERED),
        readPartOptions,
        borrowedSeasonOf: (_mediaId, season) =>
          Promise.resolve(season === 7 ? { externalId: '900', season: 1 } : null),
        readAgain: () => Promise.resolve(null),
        fetchLogos: () => Promise.resolve(null),
      });

      await choices.readPart('ep-1', { season: 7, episode: null });
      await choices.readPart('ep-1', { season: 7, episode: 1 });
      await choices.readPart('ep-1', { season: 2, episode: null });

      expect(readPartOptions.mock.calls).toEqual([
        [{ externalId: '900', season: 1, episode: null }],
        [{ externalId: '900', season: 1, episode: 1 }],
        [{ externalId: '100', season: 2, episode: null }],
      ]);
      await expect(
        choices.choosePart(
          'ep-1',
          { season: 7, episode: null },
          `${BASE}/original/revival.jpg`,
          null,
        ),
      ).resolves.toEqual({ jobId: null });
    },
    STARTING_THE_DATABASE_MS,
  );

  it('keeps an uploaded picture and chooses it, turning away what is not a picture', async () => {
    const uploads = await mkdtemp(join(tmpdir(), 'valence-uploads-'));
    const choices = createArtworkChoices({
      db: await aScratchDatabase(),
      readOptions: () => Promise.resolve(OFFERED),
      readAgain: () => Promise.resolve(null),
      fetchLogos: () => Promise.resolve(null),
      uploads,
    });

    await expect(
      choices.upload(
        'film',
        'poster',
        { body: new Uint8Array([1, 2]), contentType: 'text/plain' },
        null,
      ),
    ).resolves.toEqual({ fault: 'notAPicture' });

    const png = new Uint8Array(
      await sharp({
        create: { width: 4, height: 6, channels: 3, background: { r: 0, g: 0, b: 0 } },
      })
        .png()
        .toBuffer(),
    );

    await expect(
      choices.upload('film', 'poster', { body: png, contentType: 'image/png' }, null),
    ).resolves.toEqual({ jobId: null });
    expect(await readdir(uploads)).toHaveLength(1);
    expect(await readFile(join(uploads, (await readdir(uploads))[0] ?? ''))).toEqual(
      Buffer.from(png),
    );
  });

  it('shows the pictures the catalogue would pick itself, beside the ones to choose from', async () => {
    const db = await aScratchDatabase();
    const choices = createArtworkChoices({
      db,
      readOptions: () => Promise.resolve(OFFERED),
      readOwn: () => Promise.resolve(OWN),
      readAgain: () => Promise.resolve(null),
      fetchLogos: () => Promise.resolve(null),
    });

    expect(await choices.read('film')).toMatchObject({
      defaults: {
        poster: `${BASE}/w342/own-poster.jpg`,
        backdrop: `${BASE}/w780/own-backdrop.jpg`,
        logo: null,
      },
    });
  });

  it('notes the pictures changed on every file of the title, and says which', async () => {
    const db = await aScratchDatabase();
    const onChanged = vi.fn();
    const changedAt = new Date('2026-10-22T03:00:00.000Z');
    const choices = createArtworkChoices({
      db,
      readOptions: () => Promise.resolve(OFFERED),
      readAgain: () => Promise.resolve(null),
      fetchLogos: () => Promise.resolve(null),
      onChanged,
      now: () => changedAt,
    });

    await choices.choose('ep-1', 'backdrop', `${BASE}/original/backdrop-a.jpg`, null);

    const rows = await db
      .select({ id: mediaItem.id, at: mediaItem.artworkChangedAt })
      .from(mediaItem)
      .where(eq(mediaItem.libraryId, 'shows'));

    expect(rows).toEqual(
      expect.arrayContaining([
        { id: 'ep-1', at: changedAt },
        { id: 'ep-2', at: changedAt },
      ]),
    );
    expect(onChanged).toHaveBeenCalledWith(expect.arrayContaining(['ep-1', 'ep-2']));
  });

  it('puts the catalogue’s own pick back straight away where it can be asked', async () => {
    const db = await aScratchDatabase();
    const readAgain = vi.fn(() => Promise.resolve('read-again-job'));
    const choices = createArtworkChoices({
      db,
      readOptions: () => Promise.resolve(OFFERED),
      readOwn: () => Promise.resolve(OWN),
      readAgain,
      fetchLogos: () => Promise.resolve(null),
    });

    await choices.choose('film', 'poster', `${BASE}/original/poster-a.jpg`, null);

    expect(await choices.choose('film', 'poster', null, null)).toEqual({ jobId: null });
    expect((await db.select().from(mediaItem).where(eq(mediaItem.id, 'film')))[0]?.posterUrl).toBe(
      `${BASE}/w500/own-poster.jpg`,
    );
    expect(readAgain).not.toHaveBeenCalled();
  });

  it('says so when a file is not matched to anything', async () => {
    const { choices } = await someChoices();

    expect(await choices.read('stray')).toBe('unmatched');
    expect(await choices.read('nothing')).toBe('missing');
  });

  it('puts a chosen poster on every episode of a programme', async () => {
    const { choices, column } = await someChoices();
    const url = `${BASE}/original/poster-b.jpg`;

    expect(await choices.choose('ep-2', 'poster', url, 'admin')).toEqual({ jobId: null });
    expect(await column('ep-1', 'posterUrl')).toBe(url);
    expect(await column('ep-2', 'posterUrl')).toBe(url);
    expect(await choices.urlFor('ep-1', 'poster', false)).toBe(url);
  });

  it('keeps episode stills, giving a programme’s backdrop only where the title is asked for', async () => {
    const { choices, column } = await someChoices();
    const url = `${BASE}/original/backdrop-a.jpg`;

    await choices.choose('ep-1', 'backdrop', url, null);

    expect(await column('ep-1', 'backdropUrl')).toBe('still-1.jpg');
    expect(await choices.urlFor('ep-1', 'backdrop', false)).toBeNull();
    expect(await choices.urlFor('ep-1', 'backdrop', true)).toBe(url);
  });

  it('gives a film its chosen backdrop everywhere', async () => {
    const { choices, column } = await someChoices();
    const url = `${BASE}/original/backdrop-a.jpg`;

    await choices.choose('film', 'backdrop', url, null);

    expect(await column('film', 'backdropUrl')).toBe(url);
    expect(await choices.urlFor('film', 'backdrop', false)).toBe(url);
  });

  it('refuses a picture the catalogue does not offer', async () => {
    const { choices, column } = await someChoices();

    expect(await choices.choose('film', 'poster', 'https://elsewhere.test/x.jpg', null)).toBe(
      'refused',
    );
    expect(await column('film', 'posterUrl')).toBe('fp.jpg');
  });

  it('replaces an earlier choice rather than keeping two', async () => {
    const { choices } = await someChoices();

    await choices.choose('film', 'poster', `${BASE}/original/poster-a.jpg`, null);
    await choices.choose('film', 'poster', `${BASE}/original/poster-b.jpg`, null);

    const read = await choices.read('film');

    expect(
      read !== 'missing' && read !== 'unmatched' && read !== 'unavailable' && read.chosen.poster,
    ).toBe(`${BASE}/original/poster-b.jpg`);
  });

  it('goes back to the catalogue’s poster by reading the title again', async () => {
    const { choices, readAgain } = await someChoices();

    await choices.choose('ep-1', 'poster', `${BASE}/original/poster-a.jpg`, null);

    expect(await choices.choose('ep-1', 'poster', null, null)).toEqual({ jobId: 'read-again-job' });
    expect(readAgain).toHaveBeenCalledWith('shows', ['/shows/a/1.mkv', '/shows/a/2.mkv']);
    expect(await choices.urlFor('ep-1', 'poster', false)).toBeNull();
  });

  it('goes back to the catalogue’s lettering by fetching it again', async () => {
    const { choices, fetchLogos, column } = await someChoices();

    await choices.choose('film', 'logo', `${BASE}/original/logo-a.png`, null);

    expect(await choices.choose('film', 'logo', null, null)).toEqual({ jobId: 'logos-job' });
    expect(await column('film', 'logoUrl')).toBeNull();
    expect(fetchLogos).toHaveBeenCalledWith('films');
  });

  it('says the catalogue could not be asked, rather than choosing blind', async () => {
    const db = await aScratchDatabase();
    const choices = createArtworkChoices({
      db,
      readOptions: () => Promise.resolve(null),
      readAgain: () => Promise.resolve(null),
      fetchLogos: () => Promise.resolve(null),
    });

    expect(await choices.read('film')).toBe('unavailable');
    expect(await choices.choose('film', 'poster', `${BASE}/original/poster-a.jpg`, null)).toBe(
      'unavailable',
    );
  });

  describe('a poster with no lettering', () => {
    const bare = (path: string) => ({ ...option(path), language: null });

    const LETTERLESS: ArtworkChoices['options'] = {
      ...OFFERED,
      poster: [option('/poster-a.jpg'), bare('/bare-a.jpg'), bare('/bare-b.jpg')],
    };

    const withCatalogue = async (readOptions: () => Promise<ArtworkChoices['options'] | null>) =>
      createArtworkChoices({
        db: await aScratchDatabase(),
        readOptions,
        readAgain: () => Promise.resolve(null),
        fetchLogos: () => Promise.resolve(null),
      });

    it('takes the catalogue’s best poster with no lettering on it', async () => {
      const choices = await withCatalogue(() => Promise.resolve(LETTERLESS));

      expect(await choices.barePosterFor('film')).toBe(`${BASE}/original/bare-a.jpg`);
    });

    it('takes the poster chosen for the title where that one has no lettering', async () => {
      const choices = await withCatalogue(() => Promise.resolve(LETTERLESS));
      await choices.choose('film', 'poster', `${BASE}/original/bare-b.jpg`, null);

      expect(await choices.barePosterFor('film')).toBe(`${BASE}/original/bare-b.jpg`);
    });

    it('finds the programme’s from any of its episodes', async () => {
      const choices = await withCatalogue(() => Promise.resolve(LETTERLESS));

      expect(await choices.barePosterFor('ep-2')).toBe(`${BASE}/original/bare-a.jpg`);
    });

    it('has none where every poster is lettered, or the file is not matched', async () => {
      const choices = await withCatalogue(() => Promise.resolve(OFFERED));

      expect(await choices.barePosterFor('film')).toBeNull();
      expect(await choices.barePosterFor('stray')).toBeNull();
      expect(await choices.barePosterFor('nothing')).toBeNull();
    });

    it('asks again after the catalogue could not be asked', async () => {
      const readOptions = vi
        .fn<() => Promise<ArtworkChoices['options'] | null>>()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValue(LETTERLESS);
      const choices = await withCatalogue(readOptions);

      expect(await choices.barePosterFor('film')).toBeNull();
      expect(await choices.barePosterFor('film')).toBe(`${BASE}/original/bare-a.jpg`);
    });
  });
});
