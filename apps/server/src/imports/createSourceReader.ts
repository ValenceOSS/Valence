/* oxlint-disable valence/no-hard-coded-strings -- product names, which are never translated */
import type { MediaImportKind } from '@ValenceContracts/schemas/MediaImport';
import { createMediaBrowserReader } from './createMediaBrowserReader';
import { createPlexReader } from './createPlexReader';
import { createPlexTvCaller } from './createPlexTvCaller';
import { createSourceCaller } from './createSourceCaller';
import { plexHeadersOf } from './plexHeadersOf';
import type { SourceFetch } from './createSourceCaller';
import type { SourceReader } from './SourceReader';

type SourceAddress = {
  kind: MediaImportKind;
  url: string;
  token: string;
  clientId: string;
  userTokens?: Readonly<Record<string, string>>;
};

const PRODUCT = 'Valence';

/**
 * Builds the reader for a source from where it answers and its key, sending the key the way that
 * kind of server expects it.
 *
 * @param source - What kind of server it is, where, its key, and the client identifier to show it.
 * @param fetch - How to reach it.
 * @param regions - The certification systems its parental ratings are read in.
 * @returns The reader.
 */
const createSourceReader = (
  source: SourceAddress,
  fetch: SourceFetch,
  regions: readonly string[],
): SourceReader => {
  const name = source.kind === 'plex' ? 'Plex' : source.kind === 'emby' ? 'Emby' : 'Jellyfin';

  if (source.kind === 'plex') {
    return createPlexReader({
      server: createSourceCaller({
        fetch,
        base: source.url,
        name,
        headers: plexHeadersOf(source.token, source.clientId),
      }),
      plexTv: createPlexTvCaller(fetch, source.token, source.clientId),
      ownerToken: source.token,
      userTokens: source.userTokens ?? {},
      regions,
    });
  }

  const headers: Record<string, string> =
    source.kind === 'emby'
      ? { 'X-Emby-Token': source.token }
      : {
          Authorization: `MediaBrowser Client="${PRODUCT}", Device="${PRODUCT}", DeviceId="${source.clientId}", Version="1", Token="${source.token}"`,
        };

  return createMediaBrowserReader({
    kind: source.kind,
    caller: createSourceCaller({ fetch, base: source.url, name, headers }),
    regions,
  });
};

export type { SourceAddress };

export { createSourceReader };
