import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

const HERE = new Set<MediaRequest['items'][number]['state']>(['available', 'filed']);

/**
 * How much of what some requests follow is not in the library yet, and so will be searched for: the
 * films, the episodes, and the albums.
 *
 * @param requests - The requests.
 * @returns How many of each.
 */
const countStillWanted = (
  requests: readonly MediaRequest[],
): { films: number; episodes: number; albums: number } => {
  const missing = (kinds: readonly MediaRequest['kind'][]) =>
    requests
      .filter((request) => kinds.includes(request.kind))
      .flatMap((request) => request.items)
      .filter((item) => !HERE.has(item.state)).length;

  return {
    films: missing(['film']),
    episodes: missing(['series']),
    albums: missing(['artist', 'album']),
  };
};

export { countStillWanted };
