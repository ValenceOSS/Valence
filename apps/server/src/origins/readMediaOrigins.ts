import { linkStateOf } from '@ValenceServer/origins/linkStateOf';
import { originOf } from '@ValenceServer/origins/originOf';
import type { FiledOrigin, MediaLink, MediaOrigin } from '@ValenceContracts/schemas/MediaOrigin';
import type { MediaOriginStore } from '@ValenceServer/origins/MediaOriginStore';

const MOST_ASKED_AT_ONCE = 500;

type OriginSources = {
  recorded: Pick<MediaOriginStore, 'read'>;
  filed: (paths: readonly string[]) => Promise<Record<string, FiledOrigin>>;
  linkOf?: (path: string) => Promise<MediaLink | null>;
};

/**
 * Says where each of some library files came from and whether it is linked to a download now:
 * asking the requests service what it filed, reading what the server recorded, and reading each
 * file's links from the disk. A requests service that cannot be reached leaves its files said to
 * have been found on the disk, rather than failing the whole answer.
 *
 * @param paths - The files.
 * @param sources - Where each part of the answer comes from.
 * @returns Where each came from, by its path.
 */
const readMediaOrigins = async (
  paths: readonly string[],
  { recorded, filed, linkOf = linkStateOf }: OriginSources,
): Promise<Record<string, MediaOrigin>> => {
  if (paths.length === 0) {
    return {};
  }

  const [fromRequests, fromServer, links] = await Promise.all([
    Promise.all(
      Array.from({ length: Math.ceil(paths.length / MOST_ASKED_AT_ONCE) }, (_, at) =>
        filed(paths.slice(at * MOST_ASKED_AT_ONCE, (at + 1) * MOST_ASKED_AT_ONCE)).catch(
          (): Record<string, FiledOrigin> => ({}),
        ),
      ),
    ),
    recorded.read(paths),
    Promise.all(paths.map(linkOf)),
  ]);
  const filedOf = new Map(fromRequests.flatMap((some) => Object.entries(some)));
  const recordedOf = new Map(Object.entries(fromServer));

  return Object.fromEntries(
    paths.map((path, at) => [
      path,
      originOf(filedOf.get(path), recordedOf.get(path), links[at] ?? null),
    ]),
  );
};

export type { OriginSources };

export { readMediaOrigins };
