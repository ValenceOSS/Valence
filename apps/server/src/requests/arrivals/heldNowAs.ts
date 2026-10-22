import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueLookup } from '@ValenceServer/requests/catalogue/CatalogueLookup';

/**
 * Where the library holds a request's title now, looked up by its catalogue ids as an arrival is.
 *
 * @param request - The request.
 * @param lookup - The libraries, looked into by catalogue ids.
 * @returns The item it is held as, or null where the library no longer holds it.
 */
const heldNowAs = async (
  request: MediaRequest,
  lookup: Pick<CatalogueLookup, 'films' | 'series' | 'albums'>,
): Promise<string | null> => {
  if (isMusicRequest(request.kind)) {
    const albums = await lookup.albums(
      request.items.flatMap((item) => (item.musicBrainzId === null ? [] : [item.musicBrainzId])),
    );
    const [first] = albums.values();

    return first ?? null;
  }

  if (request.tmdbId === null) {
    return null;
  }

  const tmdbId = request.tmdbId.toString();
  const found = await (request.kind === 'film' ? lookup.films : lookup.series)([tmdbId]);

  return found.get(tmdbId) ?? null;
};

export { heldNowAs };
