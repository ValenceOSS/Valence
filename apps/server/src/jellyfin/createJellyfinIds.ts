import { isVideoLibrary } from '@ValenceServer/jellyfin/isVideoLibrary';
import { jellyfinIdOf } from '@ValenceServer/jellyfin/jellyfinIdOf';
import { personOfJellyfinId } from '@ValenceServer/jellyfin/personOfJellyfinId';
import { readSeasonJellyfinId } from '@ValenceServer/jellyfin/readSeasonJellyfinId';
import { seasonPrefixOf } from '@ValenceServer/jellyfin/seasonPrefixOf';
import { showJellyfinId } from '@ValenceServer/jellyfin/showJellyfinId';
import { showKeyOf } from '@ValenceServer/jellyfin/showKeyOf';
import { uuidOfJellyfinId } from '@ValenceServer/jellyfin/uuidOfJellyfinId';
import type { JellyfinBackend, JellyfinCaller } from '@ValenceServer/jellyfin/JellyfinBackend';
import type { JellyfinTarget } from '@ValenceServer/jellyfin/JellyfinTarget';

type ShowRef = { libraryId: string; showId: string };

const MOST_REMEMBERED = 50_000;

/**
 * Turns the identifiers Jellyfin's apps send back into what Valence calls the same things. A
 * library, a film and an episode carry their own UUID, and a person carries their number; a
 * programme and its seasons are known by identifiers worked out from what they are, which are
 * remembered as they are handed out, and worked out again from the viewer's libraries for one that
 * was handed out before a restart.
 *
 * @param backend - Where the viewer's libraries and programmes are read.
 * @returns How to remember a programme and how to read an identifier.
 */
const createJellyfinIds = (
  backend: Pick<JellyfinBackend, 'libraries' | 'listShows' | 'getMedia'>,
) => {
  const shows = new Map<string, ShowRef>();
  const seasons = new Map<string, ShowRef>();

  const remember = (libraryId: string, showId: string): void => {
    if (shows.size >= MOST_REMEMBERED) {
      shows.clear();
      seasons.clear();
    }

    const ref = { libraryId, showId };

    shows.set(showJellyfinId(libraryId, showId), ref);
    seasons.set(seasonPrefixOf(showKeyOf(libraryId, showId)), ref);
  };

  const known = (id: string): JellyfinTarget | null => {
    const show = shows.get(id);

    if (show !== undefined) {
      return { kind: 'show', ...show };
    }

    const { prefix, seasonNumber } = readSeasonJellyfinId(id);
    const season = seasons.get(prefix);

    return season === undefined ? null : { kind: 'season', ...season, seasonNumber };
  };

  const relearn = async (caller: JellyfinCaller): Promise<void> => {
    const libraries = (await backend.libraries(caller)).filter(
      (library) => isVideoLibrary(library) && library.kind !== 'movies',
    );

    for (const library of libraries) {
      for (const show of await backend.listShows(caller, library.id)) {
        remember(library.id, show.id);
      }
    }
  };

  const read = async (caller: JellyfinCaller, asked: string): Promise<JellyfinTarget | null> => {
    const id = asked.replaceAll('-', '').toLowerCase();
    const library = (await backend.libraries(caller)).find(
      (one) => jellyfinIdOf(one.id) === id && isVideoLibrary(one),
    );

    if (library !== undefined) {
      return { kind: 'library', library };
    }

    const personId = personOfJellyfinId(id);

    if (personId !== null) {
      return { kind: 'person', personId };
    }

    const remembered = known(id);

    if (remembered !== null) {
      return remembered;
    }

    const mediaId = uuidOfJellyfinId(id);

    if (mediaId !== null && (await backend.getMedia(caller, mediaId)) !== null) {
      return { kind: 'media', mediaId };
    }

    await relearn(caller);

    return known(id);
  };

  return { remember, read };
};

type JellyfinIds = ReturnType<typeof createJellyfinIds>;

export type { JellyfinIds };

export { createJellyfinIds };
