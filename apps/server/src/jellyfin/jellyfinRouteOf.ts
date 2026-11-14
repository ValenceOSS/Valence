import { JELLYFIN_BASE_PATH } from '@ValenceServer/jellyfin/JELLYFIN_BASE_PATH';

const STREAM_FILES = /^(\/videos\/[^/]+\/hls\/)(.*)$/iu;

/**
 * The address a Jellyfin endpoint is matched by, from the one an app asked for: without the base
 * Jellyfin answers under, and in lower case, since Jellyfin matches its addresses whatever their
 * case and its apps write them in more than one. A stream's own files keep their case, since the
 * ticket in their address is a secret written in both.
 *
 * @param path - The path the app asked for.
 * @returns The path to match.
 */
const jellyfinRouteOf = (path: string): string => {
  const bare = path.slice(JELLYFIN_BASE_PATH.length) || '/';
  const stream = STREAM_FILES.exec(bare);

  return stream === null
    ? bare.toLowerCase()
    : `${(stream[1] ?? '').toLowerCase()}${stream[2] ?? ''}`;
};

export { jellyfinRouteOf };
