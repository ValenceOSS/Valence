import { createSourceCaller } from './createSourceCaller';
import type { SourceFetch } from './createSourceCaller';
import { plexHeadersOf } from './plexHeadersOf';

const PLEX_TV = 'https://plex.tv';

/**
 * Builds the caller that reads plex.tv as the server's owner, for the people the server is shared
 * with and the tokens plex.tv holds for them.
 *
 * @param fetch - How to reach it.
 * @param token - The owner's token.
 * @param clientId - The identifier Plex knows this importer by.
 * @returns The caller.
 */
const createPlexTvCaller = (fetch: SourceFetch, token: string, clientId: string) =>
  createSourceCaller({
    fetch,
    base: PLEX_TV,
    name: 'plex.tv',
    headers: plexHeadersOf(token, clientId),
  });

export { createPlexTvCaller };
