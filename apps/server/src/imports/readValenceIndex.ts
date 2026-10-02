import { eq, isNull } from 'drizzle-orm';
import { mediaItem, musicAlbum, musicArtist, musicTrack, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { nameKey } from '@ValenceServer/music/nameKey';
import { titleKey } from './titleKey';

type ValenceIndex = {
  filmsByTmdb: Map<string, string[]>;
  filmsByImdb: Map<string, string[]>;
  filmsByTitle: Map<string, string[]>;
  byPath: Map<string, string>;
  episodesByTmdb: Map<string, string>;
  episodesByTitle: Map<string, string[]>;
  seriesByTmdb: Map<string, string>;
  seriesByTitle: Map<string, string[]>;
  tracksByAlbumId: Map<string, string>;
  tracksByAlbumTitle: Map<string, string[]>;
  artistsByMusicBrainz: Map<string, string>;
  artistsByName: Map<string, string[]>;
  durations: Map<string, number>;
  kinds: Map<string, 'film' | 'episode' | 'track'>;
};

/**
 * Adds a value under a key of a many-valued map, once.
 *
 * @param map - The map.
 * @param key - The key.
 * @param value - The value.
 */
const addTo = (map: Map<string, string[]>, key: string, value: string): void => {
  const held = map.get(key) ?? [];

  if (!held.includes(value)) {
    held.push(value);
  }

  map.set(key, held);
};

/**
 * Reads what Valence already holds into the lookups an import matches against: films by catalogue
 * id and by title and year, episodes by programme and number, tracks by album and position, and
 * everything by where its file is.
 *
 * @param db - The database.
 * @returns The lookups.
 */
const readValenceIndex = async (db: AnyValenceDatabase): Promise<ValenceIndex> => {
  const index: ValenceIndex = {
    filmsByTmdb: new Map(),
    filmsByImdb: new Map(),
    filmsByTitle: new Map(),
    byPath: new Map(),
    episodesByTmdb: new Map(),
    episodesByTitle: new Map(),
    seriesByTmdb: new Map(),
    seriesByTitle: new Map(),
    tracksByAlbumId: new Map(),
    tracksByAlbumTitle: new Map(),
    artistsByMusicBrainz: new Map(),
    artistsByName: new Map(),
    durations: new Map(),
    kinds: new Map(),
  };

  const tracks = await db
    .select({
      mediaItemId: musicTrack.mediaItemId,
      discNumber: musicTrack.discNumber,
      trackNumber: musicTrack.trackNumber,
      albumTitle: musicAlbum.title,
      albumId: musicAlbum.musicbrainzId,
      releaseGroupId: musicAlbum.releaseGroupMusicbrainzId,
    })
    .from(musicTrack)
    .innerJoin(musicAlbum, eq(musicAlbum.id, musicTrack.albumId));
  const trackIds = new Set<string>();

  for (const track of tracks) {
    trackIds.add(track.mediaItemId);
    index.kinds.set(track.mediaItemId, 'track');

    if (track.trackNumber === null) {
      continue;
    }

    const position = `${(track.discNumber ?? 1).toString()}|${track.trackNumber.toString()}`;

    for (const albumId of [track.albumId, track.releaseGroupId]) {
      if (albumId !== null && albumId !== '') {
        index.tracksByAlbumId.set(`${albumId.toLowerCase()}|${position}`, track.mediaItemId);
      }
    }

    addTo(index.tracksByAlbumTitle, `${titleKey(track.albumTitle)}|${position}`, track.mediaItemId);
  }

  const items = await db
    .select({
      id: mediaItem.id,
      path: mediaItem.path,
      title: mediaItem.title,
      year: mediaItem.year,
      externalId: mediaItem.externalId,
      imdbId: mediaItem.imdbId,
      seriesTitle: mediaItem.seriesTitle,
      seasonNumber: mediaItem.seasonNumber,
      episodeNumber: mediaItem.episodeNumber,
      episodeNumberEnd: mediaItem.episodeNumberEnd,
      durationSeconds: mediaItem.durationSeconds,
    })
    .from(mediaItem)
    .where(isNull(mediaItem.extraKind));

  for (const item of items) {
    index.byPath.set(item.path, item.id);
    index.durations.set(item.id, item.durationSeconds);

    if (trackIds.has(item.id)) {
      continue;
    }

    if (item.seasonNumber !== null && item.episodeNumber !== null) {
      index.kinds.set(item.id, 'episode');

      const last = Math.max(item.episodeNumberEnd ?? item.episodeNumber, item.episodeNumber);

      for (let episode = item.episodeNumber; episode <= last; episode += 1) {
        const position = `${item.seasonNumber.toString()}|${episode.toString()}`;

        if (item.externalId !== null) {
          index.episodesByTmdb.set(`${item.externalId}|${position}`, item.id);
        }

        if (item.seriesTitle !== null) {
          addTo(index.episodesByTitle, `${titleKey(item.seriesTitle)}|${position}`, item.id);
        }
      }

      continue;
    }

    index.kinds.set(item.id, 'film');

    if (item.externalId !== null) {
      addTo(index.filmsByTmdb, item.externalId, item.id);
    }

    if (item.imdbId !== null) {
      addTo(index.filmsByImdb, item.imdbId.toLowerCase(), item.id);
    }

    addTo(index.filmsByTitle, `${titleKey(item.title)}|${(item.year ?? '').toString()}`, item.id);
  }

  const shows = await db
    .select({ id: series.id, title: series.title, externalId: series.externalId })
    .from(series);

  for (const show of shows) {
    if (show.externalId !== null) {
      index.seriesByTmdb.set(show.externalId, show.id);
    }

    addTo(index.seriesByTitle, titleKey(show.title), show.id);
  }

  const artists = await db
    .select({
      id: musicArtist.id,
      name: musicArtist.name,
      musicbrainzId: musicArtist.musicbrainzId,
    })
    .from(musicArtist);

  for (const artist of artists) {
    if (artist.musicbrainzId !== null) {
      index.artistsByMusicBrainz.set(artist.musicbrainzId.toLowerCase(), artist.id);
    }

    addTo(index.artistsByName, nameKey(artist.name), artist.id);
  }

  return index;
};

export type { ValenceIndex };

export { readValenceIndex };
