import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { book, library, mediaItem, musicAlbum, musicArtist, series } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { HeldTitle } from '@ValenceServer/requests/titles/HeldTitle';

/**
 * Reads a moment as the contract writes it, saying nothing where there is none.
 *
 * @param at - The moment.
 * @returns It in ISO form, or nothing.
 */
const isoOf = (at: Date | null): string | null => (at === null ? null : at.toISOString());

/**
 * The earlier of two moments written in ISO form, either of which may be missing.
 *
 * @param left - One moment.
 * @param right - The other.
 * @returns The earlier.
 */
const earlierOf = (left: string | null, right: string | null): string | null =>
  left === null ? right : right === null || left <= right ? left : right;

/**
 * Every title the server's own libraries hold, as the admin Catalogue lists it: each film, each
 * series with how many episodes it holds, each artist with how many albums, each album, and each
 * book or audiobook, with the catalogue id it is known by where it has one. Libraries on linked
 * servers are left out, and so are extras.
 *
 * @param db - The database.
 * @returns How to read them.
 */
const createDatabaseHeldTitles = (db: AnyValenceDatabase) => async (): Promise<HeldTitle[]> => {
  const [films, programmes, episodes, artists, albums, books] = await Promise.all([
    db
      .select({
        id: mediaItem.id,
        libraryId: mediaItem.libraryId,
        title: mediaItem.title,
        year: mediaItem.year,
        externalId: mediaItem.externalId,
        addedAt: mediaItem.addedAt,
      })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(
        and(
          eq(library.kind, 'movies'),
          isNull(library.linkedServerId),
          isNull(mediaItem.seriesId),
          isNull(mediaItem.parentId),
          isNull(mediaItem.extraKind),
        ),
      ),
    db
      .select({
        id: series.id,
        libraryId: series.libraryId,
        title: series.title,
        externalId: series.externalId,
      })
      .from(series)
      .innerJoin(library, eq(library.id, series.libraryId))
      .where(isNull(library.linkedServerId)),
    db
      .select({
        id: mediaItem.id,
        seriesId: mediaItem.seriesId,
        year: mediaItem.year,
        addedAt: mediaItem.addedAt,
      })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(
        and(
          isNull(library.linkedServerId),
          isNotNull(mediaItem.seriesId),
          isNotNull(mediaItem.episodeNumber),
          isNull(mediaItem.extraKind),
          isNull(mediaItem.parentId),
        ),
      ),
    db
      .select({
        id: musicArtist.id,
        libraryId: musicArtist.libraryId,
        name: musicArtist.name,
        musicbrainzId: musicArtist.musicbrainzId,
        addedAt: musicArtist.addedAt,
      })
      .from(musicArtist)
      .innerJoin(library, eq(library.id, musicArtist.libraryId))
      .where(isNull(library.linkedServerId)),
    db
      .select({
        id: musicAlbum.id,
        libraryId: musicAlbum.libraryId,
        artistId: musicAlbum.artistId,
        artist: musicArtist.name,
        title: musicAlbum.title,
        year: musicAlbum.year,
        releaseGroup: musicAlbum.releaseGroupMusicbrainzId,
        addedAt: musicAlbum.addedAt,
      })
      .from(musicAlbum)
      .innerJoin(musicArtist, eq(musicArtist.id, musicAlbum.artistId))
      .innerJoin(library, eq(library.id, musicAlbum.libraryId))
      .where(isNull(library.linkedServerId)),
    db
      .select({
        id: book.id,
        libraryId: book.libraryId,
        title: book.title,
        year: book.year,
        authors: book.authors,
        externalId: book.externalId,
        layout: book.layout,
        addedAt: book.addedAt,
      })
      .from(book)
      .innerJoin(library, eq(library.id, book.libraryId))
      .where(isNull(library.linkedServerId)),
  ]);

  const bySeries = new Map<
    string,
    { held: number; cover: string; year: number | null; addedAt: string | null }
  >();

  for (const episode of episodes) {
    if (episode.seriesId === null) {
      continue;
    }

    const kept = bySeries.get(episode.seriesId);
    const addedAt = isoOf(episode.addedAt);

    bySeries.set(episode.seriesId, {
      held: (kept?.held ?? 0) + 1,
      cover: kept === undefined || episode.id < kept.cover ? episode.id : kept.cover,
      year:
        kept === undefined || kept.year === null
          ? episode.year
          : episode.year === null
            ? kept.year
            : Math.min(kept.year, episode.year),
      addedAt: earlierOf(kept?.addedAt ?? null, addedAt),
    });
  }

  const albumsOf = new Map<string, number>();

  for (const album of albums) {
    albumsOf.set(album.artistId, (albumsOf.get(album.artistId) ?? 0) + 1);
  }

  return [
    ...films.map((film): HeldTitle => ({
      kind: 'film',
      id: film.id,
      libraryId: film.libraryId,
      catalogueId: film.externalId,
      title: film.title,
      subtitle: null,
      year: film.year,
      art: { kind: 'media', id: film.id },
      held: 1,
      isAudio: false,
      addedAt: isoOf(film.addedAt),
    })),
    ...programmes.flatMap((programme): HeldTitle[] => {
      const held = bySeries.get(programme.id);

      return held === undefined
        ? []
        : [
            {
              kind: 'series',
              id: programme.id,
              libraryId: programme.libraryId,
              catalogueId: programme.externalId,
              title: programme.title,
              subtitle: null,
              year: held.year,
              art: { kind: 'media', id: held.cover },
              held: held.held,
              isAudio: false,
              addedAt: held.addedAt,
            },
          ];
    }),
    ...artists.map((artist): HeldTitle => ({
      kind: 'artist',
      id: artist.id,
      libraryId: artist.libraryId,
      catalogueId: artist.musicbrainzId,
      title: artist.name,
      subtitle: null,
      year: null,
      art: { kind: 'artist', id: artist.id },
      held: albumsOf.get(artist.id) ?? 0,
      isAudio: false,
      addedAt: isoOf(artist.addedAt),
    })),
    ...albums.map((album): HeldTitle => ({
      kind: 'album',
      id: album.id,
      libraryId: album.libraryId,
      catalogueId: album.releaseGroup,
      title: album.title,
      subtitle: album.artist,
      year: album.year,
      art: { kind: 'album', id: album.id },
      held: 1,
      isAudio: false,
      addedAt: isoOf(album.addedAt),
    })),
    ...books.map((held): HeldTitle => ({
      kind: 'book',
      id: held.id,
      libraryId: held.libraryId,
      catalogueId: held.externalId,
      title: held.title,
      subtitle: Array.isArray(held.authors)
        ? held.authors.filter((one) => typeof one === 'string').join(', ') || null
        : null,
      year: held.year,
      art: { kind: 'book', id: held.id },
      held: 1,
      isAudio: held.layout === 'audio',
      addedAt: isoOf(held.addedAt),
    })),
  ];
};

export { createDatabaseHeldTitles };
