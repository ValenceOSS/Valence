/* oxlint-disable valence/no-hard-coded-strings -- test fixtures: the titles and names stand in for what a real server holds, and are never shown */
import { library, mediaItem, musicAlbum, musicArtist, musicTrack, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';

const ARTIST_MUSICBRAINZ = '10adbe5e-a2c0-4bf3-8249-2b4cbf6e6ca8';

const ALBUM_MUSICBRAINZ = '2c0a3d1e-aaaa-4bbb-8ccc-000000000001';

/**
 * A household whose libraries already hold what the recorded sources hold: Heat, The Wire's first
 * two episodes and a song from Blue Lines, scanned as Valence would have them, so an import has
 * something to match against.
 *
 * @param household - The household to fill, as `aHousehold` makes it.
 * @returns The same household, filled.
 */
const aLibraryToImportInto = async <Household extends { db: AnyValenceDatabase }>(
  household: Household,
): Promise<Household> => {
  const { db } = household;

  await db.insert(library).values({ id: 'shows', name: 'Shows', kind: 'shows', path: '/media/tv' });
  await db.insert(series).values({
    id: 'wire',
    libraryId: 'shows',
    key: 'the wire',
    title: 'The Wire',
    externalId: '1438',
  });
  await db.insert(mediaItem).values([
    {
      ...aMediaItemRow('heat', 'films'),
      path: '/films/Heat (1995)/Heat.mkv',
      title: 'Heat',
      year: 1995,
      externalId: '949',
      imdbId: 'tt0113277',
      durationSeconds: 10200,
    },
    {
      ...aMediaItemRow('wire-101', 'shows'),
      path: '/media/tv/The Wire/Season 01/S01E01.mkv',
      title: 'The Target',
      externalId: '1438',
      seriesId: 'wire',
      seriesTitle: 'The Wire',
      seasonNumber: 1,
      episodeNumber: 1,
      durationSeconds: 3720,
    },
    {
      ...aMediaItemRow('wire-102', 'shows'),
      path: '/media/tv/The Wire/Season 01/S01E02.mkv',
      title: 'The Detail',
      seriesId: 'wire',
      seriesTitle: 'The Wire',
      seasonNumber: 1,
      episodeNumber: 2,
      durationSeconds: 3600,
    },
    {
      ...aMediaItemRow('unfinished', 'music'),
      path: '/music/blue-lines/03.flac',
      title: 'Unfinished Sympathy',
      durationSeconds: 308,
    },
  ]);
  await db.insert(musicArtist).values({
    id: 'massive',
    libraryId: 'music',
    name: 'Massive Attack',
    nameKey: 'massive attack',
    sortName: 'Massive Attack',
    musicbrainzId: ARTIST_MUSICBRAINZ,
  });
  await db.insert(musicAlbum).values({
    id: 'blue',
    libraryId: 'music',
    artistId: 'massive',
    title: 'Blue Lines',
    titleKey: 'blue lines',
    musicbrainzId: ALBUM_MUSICBRAINZ,
  });
  await db.insert(musicTrack).values({
    mediaItemId: 'unfinished',
    albumId: 'blue',
    discNumber: 1,
    trackNumber: 3,
    codec: 'flac',
  });

  return household;
};

export { ALBUM_MUSICBRAINZ, ARTIST_MUSICBRAINZ, aLibraryToImportInto };
