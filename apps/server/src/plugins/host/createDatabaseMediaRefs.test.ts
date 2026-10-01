import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import {
  library,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
} from '#dialect/Schema';
import { createDatabaseMediaRefs } from './createDatabaseMediaRefs';

const STARTING_POSTGRES_MS = 60_000;

/**
 * An item as the scan would store it.
 *
 * @param id - The item.
 * @param libraryId - The library it is in.
 * @param title - What it is called.
 * @returns The row.
 */
const anItem = (id: string, libraryId: string, title: string): typeof mediaItem.$inferInsert => ({
  id,
  libraryId,
  path: `/${libraryId}/${id}`,
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
});

/**
 * The library a plugin is shown, over a fresh database holding two films and one song.
 *
 * @returns How a plugin searches it.
 */
const aLibrary = async () => {
  const db = await aMigratedDatabase();

  await db.insert(library).values([
    { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
    { id: 'music', name: 'Music', kind: 'music', path: '/music' },
  ]);
  await db
    .insert(mediaItem)
    .values([
      anItem('arrival', 'films', 'Arrival'),
      anItem('percent', 'films', '100% Wolf'),
      anItem('song', 'music', 'Running Up That Hill'),
    ]);
  await db.insert(musicArtist).values({
    id: 'kate',
    libraryId: 'music',
    name: 'Kate Bush',
    nameKey: 'kate bush',
    sortName: 'Bush, Kate',
  });
  await db.insert(musicAlbum).values({
    id: 'hounds',
    libraryId: 'music',
    artistId: 'kate',
    title: 'Hounds of Love',
    titleKey: 'hounds of love',
  });
  await db.insert(musicTrack).values({ mediaItemId: 'song', albumId: 'hounds', codec: 'flac' });
  await db.insert(musicTrackArtist).values({ mediaItemId: 'song', artistId: 'kate', position: 0 });

  return createDatabaseMediaRefs(db);
};

describe('createDatabaseMediaRefs', { timeout: STARTING_POSTGRES_MS }, () => {
  it('finds a film by part of its title whatever the case', async () => {
    const refs = await aLibrary();

    expect((await refs.search('ARRI', ['film'])).map((ref) => ref.id)).toEqual(['arrival']);
  });

  it('reads the characters a pattern would use as written', async () => {
    const refs = await aLibrary();

    expect((await refs.search('100%', ['film'])).map((ref) => ref.id)).toEqual(['percent']);
    await expect(refs.search('_rrival', ['film'])).resolves.toEqual([]);
  });

  it('finds a track by its title and artist whatever the case', async () => {
    const refs = await aLibrary();

    await expect(
      refs.findTrack({
        title: 'running up that hill',
        artist: 'KATE BUSH',
        album: null,
        isrc: null,
      }),
    ).resolves.toMatchObject({ id: 'song', kind: 'track' });
    await expect(
      refs.findTrack({ title: 'Running Up That Hill', artist: 'Kate', album: null, isrc: null }),
    ).resolves.toBeNull();
  });
});
