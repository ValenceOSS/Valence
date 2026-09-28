import { describeArtistForRequest } from '@ValenceServer/requests/musicBrainz/describeArtistForRequest';
import { releaseGroupCoverUrl } from '@ValenceServer/requests/musicBrainz/releaseGroupCoverUrl';
import { nameKey } from '@ValenceServer/music/nameKey';
import { findArtistBio } from './findArtistBio';
import { findArtistOnMusicBrainz } from './findArtistOnMusicBrainz';
import { tidyAlbumTitle } from './tidyAlbumTitle';
import type { ArtistStory } from '@ValenceContracts/schemas/ArtistStory';
import type { CatalogueAlbum } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicWeb } from './createMusicWeb';

const LASTS_MS = 24 * 60 * 60 * 1000;

const PAGES_READ = 2;

const WANTED_TYPES = new Set(['album', 'ep']);

type Known = {
  bio: string | null;
  sourceUrl: string | null;
  albums: CatalogueAlbum[];
};

type ArtistStories = {
  about: (artist: { name: string }, have: readonly string[]) => Promise<ArtistStory>;
};

/**
 * An album title reduced to what the library and MusicBrainz agree on.
 *
 * @param title - The title.
 * @returns What it is matched on.
 */
const matchable = (title: string): string => nameKey(tidyAlbumTitle(title));

/**
 * What can be said about an artist beyond the songs of theirs in the library: a few sentences about
 * them, and the albums and EPs of theirs the library does not have yet, each of which can be asked
 * for.
 *
 * The artist is found on MusicBrainz by name, the sentences come from the Wikipedia article it links
 * them to, and their records from MusicBrainz. Nothing needs a key. What is found about an artist is
 * kept for a day, and asking twice at once asks once, since MusicBrainz answers one question a
 * second and a page somebody is waiting on is the worst place to spend them.
 *
 * @param web - The way out to the web.
 * @returns A way to read what can be said about an artist.
 */
const createArtistStories = (web: MusicWeb): ArtistStories => {
  const kept = new Map<string, { at: number; reading: Promise<Known> }>();

  const read = async (name: string): Promise<Known> => {
    const musicBrainzId = await findArtistOnMusicBrainz(web, name);

    if (musicBrainzId === null) {
      return { bio: null, sourceUrl: null, albums: [] };
    }

    const [described, told] = await Promise.all([
      describeArtistForRequest(web, musicBrainzId, PAGES_READ),
      findArtistBio(web, musicBrainzId),
    ]);

    return {
      bio: told?.bio ?? null,
      sourceUrl: told?.sourceUrl ?? null,
      albums: (described?.albums ?? []).filter(
        (album) => album.type !== null && WANTED_TYPES.has(album.type),
      ),
    };
  };

  return {
    about: async (artist, have) => {
      const key = nameKey(artist.name);
      const earlier = kept.get(key);
      const reading =
        earlier !== undefined && Date.now() - earlier.at < LASTS_MS
          ? earlier.reading
          : read(artist.name);

      if (reading !== earlier?.reading) {
        kept.set(key, { at: Date.now(), reading });
        reading.catch(() => {
          kept.delete(key);
        });
      }

      const known = await reading;
      const owned = new Set(have.map(matchable));

      return {
        bio: known.bio,
        sourceUrl: known.sourceUrl,
        missing: known.albums
          .filter((album) => !owned.has(matchable(album.title)))
          .toSorted((left, right) =>
            (right.firstReleased ?? '').localeCompare(left.firstReleased ?? ''),
          )
          .map((album) => ({
            releaseGroupId: album.id,
            title: album.title,
            type: album.type,
            year: album.firstReleased === null ? null : Number(album.firstReleased.slice(0, 4)),
            coverUrl: releaseGroupCoverUrl(album.id, { title: album.title, artist: artist.name }),
          })),
      };
    },
  };
};

export type { ArtistStories };

export { createArtistStories };
