import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { episodePin, library, mediaItem, series, versionChoice } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createPatternRenames } from './createPatternRenames';

const STARTING_THE_DATABASE_MS = 60_000;

const roots: string[] = [];

/**
 * Makes files on a disk, with what each holds.
 *
 * @param root - The folder they go under.
 * @param paths - Each file, under it.
 */
const makeFiles = async (root: string, paths: readonly string[]) => {
  for (const path of paths) {
    await mkdir(join(root, path, '..'), { recursive: true });
    await writeFile(join(root, path), path);
  }
};

/**
 * A library on a disk of its own, with the files given in it.
 *
 * @param kind - What it holds.
 * @param paths - Its files.
 * @returns The database, its folder, the renames, and what was asked to be read again.
 */
const aLibrary = async (kind: 'movies' | 'shows', paths: readonly string[]) => {
  const root = await mkdtemp(join(tmpdir(), 'pattern-renames-'));
  const db = await aMigratedDatabase();
  const queueReadAgain = vi.fn((_libraryId: string, _paths: string[], _keepsMatches: boolean) =>
    Promise.resolve('job'),
  );

  roots.push(root);
  await makeFiles(root, paths);
  await db.insert(library).values({ id: 'lib', name: 'Library', kind, path: root });

  return { db, root, queueReadAgain, renames: createPatternRenames({ db, queueReadAgain }) };
};

/**
 * Where a file is now, by the database.
 *
 * @param db - The database.
 * @param id - The file.
 * @returns Its path.
 */
const pathOf = async (db: Awaited<ReturnType<typeof aMigratedDatabase>>, id: string) =>
  (await db.select({ path: mediaItem.path }).from(mediaItem).where(eq(mediaItem.id, id)))[0]?.path;

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await rm(root, { recursive: true, force: true });
  }
});

describe('createPatternRenames', { timeout: STARTING_THE_DATABASE_MS }, () => {
  it('renames a film’s own folder whole, then the film and its subtitles, keeping its choices', async () => {
    const { db, root, queueReadAgain, renames } = await aLibrary('movies', [
      'a film [tmdbid-5]/a.film.2001.mkv',
      'a film [tmdbid-5]/a.film.2001.en.srt',
      'a film [tmdbid-5]/poster.jpg',
      'a film [tmdbid-5]/trailer.mkv',
    ]);
    const folder = join(root, 'a film [tmdbid-5]');

    await db.insert(mediaItem).values([
      {
        ...aMediaItemRow('film', 'lib'),
        path: join(folder, 'a.film.2001.mkv'),
        title: 'A Film',
        year: 2001,
        externalId: '5',
      },
      {
        ...aMediaItemRow('trailer', 'lib'),
        path: join(folder, 'trailer.mkv'),
        parentId: 'film',
        extraKind: 'trailer',
      },
    ]);
    await db
      .insert(versionChoice)
      .values({ libraryId: 'lib', path: join(folder, 'a.film.2001.mkv'), label: 'Mine' });

    const target = join(root, 'A Film (2001) [tmdbid-5]');

    await expect(renames.plan(['film', 'trailer'])).resolves.toEqual({
      files: [
        {
          mediaId: 'film',
          from: join(folder, 'a.film.2001.mkv'),
          to: join(target, 'A Film (2001).mkv'),
          sidecars: 1,
          state: 'ready',
        },
        expect.objectContaining({ mediaId: 'trailer', state: 'extra' }),
      ],
    });
    await expect(renames.apply(['film'], 'skip')).resolves.toEqual({
      renamed: 1,
      skipped: 0,
      jobId: 'job',
    });

    expect((await readdir(target)).toSorted()).toEqual([
      'A Film (2001).en.srt',
      'A Film (2001).mkv',
      'poster.jpg',
      'trailer.mkv',
    ]);
    expect(await readdir(root)).toEqual(['A Film (2001) [tmdbid-5]']);
    expect(await pathOf(db, 'film')).toBe(join(target, 'A Film (2001).mkv'));
    expect(await pathOf(db, 'trailer')).toBe(join(target, 'trailer.mkv'));
    expect(await db.select({ path: versionChoice.path }).from(versionChoice)).toEqual([
      { path: join(target, 'A Film (2001).mkv') },
    ]);
    expect(queueReadAgain).toHaveBeenCalledWith(
      'lib',
      [join(target, 'A Film (2001).mkv'), join(target, 'trailer.mkv')],
      true,
    );
  });

  it('leaves a file already named to the pattern, and one not matched to the catalogue', async () => {
    const { db, root, renames } = await aLibrary('movies', [
      'A Film (2001)/A Film (2001).mkv',
      'unknown.mkv',
    ]);

    await db.insert(mediaItem).values([
      {
        ...aMediaItemRow('named', 'lib'),
        path: join(root, 'A Film (2001)', 'A Film (2001).mkv'),
        title: 'A Film',
        year: 2001,
        externalId: '5',
      },
      { ...aMediaItemRow('unknown', 'lib'), path: join(root, 'unknown.mkv'), externalId: null },
    ]);

    expect((await renames.plan(['named', 'unknown'])).files.map((one) => one.state)).toEqual([
      'same',
      'unmatched',
    ]);
    await expect(renames.apply(['named', 'unknown'], 'number')).resolves.toEqual({
      renamed: 0,
      skipped: 2,
      jobId: null,
    });
  });

  it('files episodes in their show’s and season’s folders, numbering a second copy when asked', async () => {
    const { db, root, renames } = await aLibrary('shows', [
      'mixed/show.s01e01.mkv',
      'mixed/show.s01e01.repack.mkv',
      'mixed/another.show.s01e01.mkv',
    ]);
    await db
      .insert(series)
      .values({ id: 'show', libraryId: 'lib', key: 'a show', title: 'A Show' });

    const episode = (id: string, file: string) => ({
      ...aMediaItemRow(id, 'lib'),
      path: join(root, 'mixed', file),
      title: 'Pilot',
      year: 2010,
      externalId: '9',
      seriesId: 'show',
      seriesTitle: 'A Show',
      seasonNumber: 1,
      episodeNumber: 1,
    });

    await db.insert(mediaItem).values([
      episode('first', 'show.s01e01.mkv'),
      episode('again', 'show.s01e01.repack.mkv'),
      {
        ...aMediaItemRow('another', 'lib'),
        path: join(root, 'mixed', 'another.show.s01e01.mkv'),
      },
    ]);
    await db.insert(episodePin).values({
      libraryId: 'lib',
      path: join(root, 'mixed', 'show.s01e01.repack.mkv'),
      seasonNumber: 1,
      episodeNumber: 1,
      episodeNumberEnd: null,
    });

    const season = join(root, 'A Show (2010)', 'Season 01');

    expect((await renames.plan(['first', 'again'])).files.map((one) => one.state)).toEqual([
      'ready',
      'taken',
    ]);
    await expect(renames.apply(['first', 'again'], 'skip')).resolves.toMatchObject({
      renamed: 1,
      skipped: 1,
    });
    await expect(renames.apply(['again'], 'number')).resolves.toMatchObject({ renamed: 1 });

    expect((await readdir(season)).toSorted()).toEqual([
      'A Show (2010) - S01E01 - Pilot - 2.mkv',
      'A Show (2010) - S01E01 - Pilot.mkv',
    ]);
    expect(await readdir(join(root, 'mixed'))).toEqual(['another.show.s01e01.mkv']);
    expect(await db.select({ path: episodePin.path }).from(episodePin)).toEqual([
      { path: join(season, 'A Show (2010) - S01E01 - Pilot - 2.mkv') },
    ]);
  });
});
