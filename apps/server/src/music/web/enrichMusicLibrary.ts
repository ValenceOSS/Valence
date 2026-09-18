import { nameKey } from '@ValenceServer/music/nameKey';
import { findAlbumCover } from './findAlbumCover';
import { findArtistLooks } from './findArtistLooks';
import { findLyrics } from './findLyrics';
import type { MusicArtwork } from '@ValenceServer/music/scanMusicLibrary';
import type { MusicWeb } from './createMusicWeb';
import type { EnrichingStore } from './EnrichingStore';

type EnrichOptions = {
  libraryId: string;
  store: EnrichingStore;
  web: MusicWeb;
  artwork: MusicArtwork;
  audioDbKey: string;
  isAgain?: boolean;
  onProgress?: (done: number, total: number) => void;
  isCancelled?: () => boolean;
};

type Enriched = {
  covers: number;
  pictures: number;
  videos: number;
  lyrics: number;
};

/**
 * Reduces a song's title to what it is matched on against a video's: the name without whatever is
 * in brackets after it, so "Caramel (Official Video)" is Caramel.
 *
 * @param title - The title.
 * @returns What it is matched on.
 */
const matchable = (title: string): string => nameKey(title.replace(/\s*[([].*?[)\]]\s*/g, ' '));

/**
 * Fills in what a music library's own files did not say, from the services music is described by:
 * covers for albums that came without one, photographs of the artists, their music videos, and
 * the words of songs that came without them.
 *
 * Only what is missing is asked for, and each album, artist and song is asked about once — what
 * was looked up and not found is remembered as looked up, so a rescan does not ask the same
 * questions of the same sites again — unless it is asked to look again, as a forced scan does, for
 * whatever is still missing. Anything the files do carry is never replaced.
 *
 * @param options - The library, where things are kept, the way out to the web, where pictures are
 *   drawn to, the TheAudioDB key, whether to ask again about what was not found before, and how to
 *   report progress and hear of cancellation.
 * @returns How much was found.
 */
const enrichMusicLibrary = async ({
  libraryId,
  store,
  web,
  artwork,
  audioDbKey,
  isAgain = false,
  onProgress,
  isCancelled = () => false,
}: EnrichOptions): Promise<Enriched> => {
  const found: Enriched = { covers: 0, pictures: 0, videos: 0, lyrics: 0 };
  const albums = await store.albumsToLookUp(libraryId, isAgain);
  const artists = await store.artistsToLookUp(libraryId, isAgain);
  const songs = await store.songsWithoutLyrics(libraryId, isAgain);
  const total = albums.length + artists.length + songs.length;
  let done = 0;

  const step = () => {
    done += 1;
    onProgress?.(done, total);
  };

  for (const album of albums) {
    if (isCancelled()) {
      return found;
    }

    const cover = await findAlbumCover(web, album);
    const kept = cover === null ? null : await artwork.keep('album', album.id, { bytes: cover });

    if (kept !== null) {
      await store.setAlbumArtwork(album.id, kept);
      found.covers += 1;
    }

    await store.markAlbumLookedUp(album.id);
    step();
  }

  for (const artist of artists) {
    if (isCancelled()) {
      return found;
    }

    const looks = await findArtistLooks(web, audioDbKey, artist.name);

    if (!artist.hasImage && looks.picture !== null) {
      const kept = await artwork.keep('artist', artist.id, { bytes: looks.picture });

      if (kept !== null) {
        await store.setArtistImage(artist.id, kept);
        found.pictures += 1;
      }
    }

    if (looks.videos.length > 0) {
      const byTitle = new Map(
        looks.videos.map((video) => [matchable(video.title), video.youtubeId]),
      );

      for (const song of await store.songsBy(artist.id)) {
        const youtubeId = byTitle.get(matchable(song.title));

        if (youtubeId !== undefined) {
          await store.setVideo(song.id, youtubeId);
          found.videos += 1;
        }
      }
    }

    await store.markArtistLookedUp(artist.id);
    step();
  }

  for (const song of songs) {
    if (isCancelled()) {
      return found;
    }

    const words = await findLyrics(web, song);

    await store.keepFoundLyrics(song.id, words);

    if (words !== null) {
      found.lyrics += 1;
    }

    step();
  }

  return found;
};

export type { Enriched };

export { enrichMusicLibrary };
