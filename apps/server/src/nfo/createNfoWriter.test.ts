import { describe, expect, it, vi } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { library, mediaItem, series } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createNfoWriter } from './createNfoWriter';

const STARTING_THE_DATABASE_MS = 60_000;

describe('createNfoWriter', { timeout: STARTING_THE_DATABASE_MS }, () => {
  it('writes a film’s NFO beside it, and an episode’s with its show’s in the show’s folder', async () => {
    const db = await aMigratedDatabase();
    const write = vi.fn((_path: string, _text: string) => Promise.resolve());

    await db.insert(library).values([
      { id: 'films', name: 'Films', kind: 'movies', path: '/films', writesNfo: true },
      { id: 'shows', name: 'Shows', kind: 'shows', path: '/shows', writesNfo: true },
    ]);
    await db
      .insert(series)
      .values({ id: 'show', libraryId: 'shows', key: 'folder:A', title: 'A show' });
    await db.insert(mediaItem).values([
      {
        ...aMediaItemRow('film', 'films'),
        path: '/films/A film (2001)/A film.mkv',
        title: 'A film',
      },
      {
        ...aMediaItemRow('one', 'shows'),
        path: '/shows/A show/Season 1/A show S01E01.mkv',
        title: 'Pilot',
        seriesId: 'show',
        seriesTitle: 'A show',
        seasonNumber: 1,
        episodeNumber: 1,
      },
    ]);

    await createNfoWriter(db, write).writeFor(['film', 'one']);

    const written = new Map(write.mock.calls.map(([path, text]) => [path, text]));

    expect(written.get('/films/A film (2001)/A film.nfo')).toContain('<title>A film</title>');
    expect(written.get('/shows/A show/Season 1/A show S01E01.nfo')).toContain('<episodedetails>');
    expect(written.get('/shows/A show/tvshow.nfo')).toContain('<title>A show</title>');
  });

  it('writes nothing for a library that does not keep NFO files', async () => {
    const db = await aMigratedDatabase();
    const write = vi.fn((_path: string, _text: string) => Promise.resolve());

    await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/films' });
    await db.insert(mediaItem).values({ ...aMediaItemRow('film', 'films'), path: '/films/a.mkv' });
    await createNfoWriter(db, write).writeFor(['film']);

    expect(write).not.toHaveBeenCalled();
  });
});
