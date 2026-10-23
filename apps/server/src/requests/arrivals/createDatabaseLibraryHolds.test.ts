import { describe, expect, it } from 'vitest';
import { mediaItem, musicAlbum, musicArtist, series } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createDatabaseLibraryHolds } from './createDatabaseLibraryHolds';
import { createDatabaseMusicStore } from '@ValenceServer/music/createDatabaseMusicStore';
import { aTrackRow } from '@ValenceServer/testing/aTrackRow';

const STARTING_POSTGRES_MS = 60_000;

describe('createDatabaseLibraryHolds', { timeout: STARTING_POSTGRES_MS }, () => {
  it('says which films, series and albums are still held, each kind apart', async () => {
    const { db } = await aHousehold();

    await db
      .insert(series)
      .values({ id: 'show', libraryId: 'films', key: 'show', title: 'Show', externalId: '1' });
    await db.insert(mediaItem).values({ ...aMediaItemRow('pilot', 'films'), seriesId: 'show' });
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
    await createDatabaseMusicStore(db).keepTrack(
      aTrackRow({ albumId: 'hounds', path: '/music/a-song.flac', artistIds: ['kate'] }),
    );

    const holds = createDatabaseLibraryHolds(db);

    expect([...(await holds('film', ['film', 'gone', 'show']))]).toEqual(['film']);
    expect([...(await holds('series', ['show', 'film']))]).toEqual(['show']);
    expect([...(await holds('album', ['hounds', 'gone']))]).toEqual(['hounds']);
    expect([...(await holds('film', []))]).toEqual([]);
  });

  it('no longer holds a film whose file went missing, or a series whose every file did', async () => {
    const { db } = await aHousehold();
    const gone = new Date('2026-10-01T00:00:00.000Z');

    await db
      .insert(series)
      .values({ id: 'show', libraryId: 'films', key: 'show', title: 'Show', externalId: '1' });
    await db.insert(mediaItem).values([
      { ...aMediaItemRow('pilot', 'films'), seriesId: 'show', missingSince: gone },
      { ...aMediaItemRow('lost', 'films'), missingSince: gone },
    ]);

    const holds = createDatabaseLibraryHolds(db);

    expect([...(await holds('film', ['film', 'lost']))]).toEqual(['film']);
    expect([...(await holds('series', ['show']))]).toEqual([]);
  });

  it('no longer holds an album whose every song went missing', async () => {
    const { db } = await aHousehold();
    const store = createDatabaseMusicStore(db);
    const artist = await store.keepArtist('music', 'Someone', null);
    const kept = async (title: string) =>
      (
        await store.keepAlbum({
          libraryId: 'music',
          artistId: artist.id,
          title,
          year: null,
          genres: [],
          isCompilation: false,
          musicbrainzId: null,
          releaseGroupMusicbrainzId: null,
        })
      ).id;
    const here = await kept('Here');
    const gone = await kept('Gone');

    await store.keepTrack(
      aTrackRow({ albumId: here, path: '/music/here.flac', artistIds: [artist.id] }),
    );
    await store.keepTrack(
      aTrackRow({ albumId: gone, path: '/music/gone.flac', artistIds: [artist.id] }),
    );
    await store.setAside('music', ['/music/gone.flac'], new Date('2026-10-01T00:00:00.000Z'));

    expect([...(await createDatabaseLibraryHolds(db)('album', [here, gone]))]).toEqual([here]);
  });
});
