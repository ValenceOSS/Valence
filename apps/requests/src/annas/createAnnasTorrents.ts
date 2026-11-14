import { z } from 'zod';
import { torrentKeyOf } from '@ValenceRequests/annas/torrentKeyOf';
import type { AnnasTorrent } from '@ValenceRequests/annas/AnnasTorrent';

type TorrentListFetch = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<Response>;

const KEPT_FOR_MS = 24 * 60 * 60 * 1000;

const WAIT_MS = 120_000;

const TorrentListSchema = z.array(
  z.object({
    group_name: z.string(),
    display_name: z.string(),
    url: z.string(),
    obsolete: z.boolean().catch(false),
    seeders: z.number().int().nullish().catch(null),
  }),
);

/**
 * Anna's Archive's list of its bulk torrents, read from a mirror at most once a day: each torrent
 * still offered, by its group and name, with where its .torrent file is and how many seed it.
 *
 * @param fetch - How to ask.
 * @param now - The time.
 * @returns How to find a torrent, and the keys of them all.
 */
const createAnnasTorrents = (fetch: TorrentListFetch, now: () => number = Date.now) => {
  let kept: { at: number; origin: string; torrents: Map<string, AnnasTorrent> } | null = null;

  const all = async (origin: string): Promise<ReadonlyMap<string, AnnasTorrent>> => {
    if (kept !== null && kept.origin === origin && now() - kept.at < KEPT_FOR_MS) {
      return kept.torrents;
    }

    const answer = await fetch(`${origin}/dyn/torrents.json`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(WAIT_MS),
    });
    const read = TorrentListSchema.safeParse(await answer.json().catch(() => null));
    const torrents = new Map(
      (read.success ? read.data : [])
        .filter((one) => !one.obsolete && URL.parse(one.url, origin)?.origin === origin)
        .map((one) => [
          torrentKeyOf(one.group_name, one.display_name),
          {
            group: one.group_name,
            name: one.display_name,
            url: new URL(one.url, origin).toString(),
            seeders: one.seeders ?? null,
          },
        ]),
    );

    if (torrents.size > 0) {
      kept = { at: now(), origin, torrents };
    }

    return torrents;
  };

  return {
    all,
    find: async (origin: string, group: string, name: string): Promise<AnnasTorrent | null> =>
      (await all(origin)).get(torrentKeyOf(group, name)) ?? null,
  };
};

type AnnasTorrents = ReturnType<typeof createAnnasTorrents>;

export type { AnnasTorrents, TorrentListFetch };

export { createAnnasTorrents };
