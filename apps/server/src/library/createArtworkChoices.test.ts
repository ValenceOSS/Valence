import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { describe, expect, it, vi } from 'vitest';
import { authSchema, valenceSchema } from '#dialect/Schema';
import { createArtworkChoices } from './createArtworkChoices';
import type { ArtworkChoices } from '@ValenceContracts/schemas/ArtworkChoice';

const STARTING_POSTGRES_MS = 30_000;

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

/**
 * A Postgres of its own, in memory, holding a programme of two episodes, a film, a file the catalogue
 * never matched, and nowhere yet to keep choices.
 *
 * @returns The database.
 */
const aScratchDatabase = async () => {
  const client = new PGlite();

  await client.exec(`
    CREATE TABLE "media_item" (
      "id" text PRIMARY KEY,
      "libraryId" text NOT NULL,
      "path" text NOT NULL,
      "seriesTitle" text,
      "externalId" text,
      "posterUrl" text,
      "backdropUrl" text,
      "logoUrl" text
    );
    CREATE TABLE "media_artwork_choice" (
      "id" text PRIMARY KEY,
      "libraryId" text NOT NULL,
      "externalKind" text NOT NULL,
      "externalId" text NOT NULL,
      "kind" text NOT NULL,
      "url" text NOT NULL,
      "updatedAt" timestamp NOT NULL DEFAULT now(),
      "updatedBy" text
    );
    CREATE UNIQUE INDEX "media_artwork_choice_title_idx"
      ON "media_artwork_choice" ("libraryId", "externalKind", "externalId", "kind");
    INSERT INTO "media_item" VALUES
      ('ep-1', 'shows', '/shows/a/1.mkv', 'A Show', '100', 'p.jpg', 'still-1.jpg', NULL),
      ('ep-2', 'shows', '/shows/a/2.mkv', 'A Show', '100', 'p.jpg', 'still-2.jpg', NULL),
      ('film', 'films', '/films/f.mkv', NULL, '100', 'fp.jpg', 'fb.jpg', 'fl.png'),
      ('stray', 'films', '/films/s.mkv', NULL, NULL, NULL, NULL, NULL);
  `);

  return { client, db: drizzle(client, { schema: { ...authSchema, ...valenceSchema } }) };
};

/**
 * Builds the choices over a scratch database, with a catalogue that offers the pictures above and
 * work that records what it was asked to do.
 *
 * @returns The choices, the database's own client, and what was asked of the library.
 */
const someChoices = async () => {
  const { client, db } = await aScratchDatabase();
  const readAgain = vi.fn(() => Promise.resolve('read-again-job'));
  const fetchLogos = vi.fn(() => Promise.resolve({ jobId: 'logos-job' }));
  const choices = createArtworkChoices({
    db,
    readOptions: () => Promise.resolve(OFFERED),
    readAgain,
    fetchLogos,
  });
  const column = async (id: string, name: string) =>
    (
      await client.query<Record<string, string | null>>(
        `SELECT "${name}" FROM "media_item" WHERE "id" = $1`,
        [id],
      )
    ).rows[0]?.[name] ?? null;

  return { choices, readAgain, fetchLogos, column };
};

describe('createArtworkChoices', { timeout: STARTING_POSTGRES_MS }, () => {
  it('offers what the catalogue has, and what is chosen now', async () => {
    const { choices } = await someChoices();

    const read = await choices.read('ep-1');

    expect(read).toEqual({
      kind: 'tv',
      options: OFFERED,
      chosen: { poster: null, backdrop: null, logo: null },
    });
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
    const { db } = await aScratchDatabase();
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
});
