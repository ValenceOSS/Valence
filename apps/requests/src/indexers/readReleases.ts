import { createHash } from 'node:crypto';
import { z } from 'zod';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import type { IndexerKind, Release } from '@ValenceContracts/schemas/Indexer';

const TextSchema = z.union([
  z.string(),
  z.object({ '#text': z.string().default('') }).transform((node) => node['#text']),
]);

const ItemSchema = z.object({
  title: TextSchema.default(''),
  guid: TextSchema.optional(),
  link: TextSchema.optional(),
  comments: TextSchema.optional(),
  pubDate: TextSchema.optional(),
  size: TextSchema.optional(),
  category: z.array(TextSchema).default([]),
  enclosure: z
    .object({ '@url': z.string().optional(), '@length': z.string().optional() })
    .optional(),
  attr: z.array(z.object({ '@name': z.string(), '@value': z.string().default('') })).default([]),
});

const FeedSchema = z.object({
  rss: z.object({
    channel: z
      .union([
        z.object({ item: z.array(z.union([z.looseObject({}), z.string()])).default([]) }),
        z.literal('').transform(() => ({ item: [] })),
      ])
      .default({ item: [] }),
  }),
});

type ReleaseSource = { id: string; name: string; kind: IndexerKind };

/**
 * Reads a whole number an indexer wrote as text.
 *
 * @param text - What it wrote.
 * @returns The number, or null where there was none.
 */
const whole = (text: string | undefined): number | null => {
  if (text === undefined || text.trim() === '') {
    return null;
  }

  const value = Number(text);

  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
};

/**
 * Reads the results an indexer answered a search with, as releases anything else in Valence can
 * compare: the size, who is sharing it, when it was posted, and where to fetch it from.
 *
 * Torznab and Newznab each spread these across the item's own tags and its `attr` list, and
 * indexers disagree on which they fill in, so each is read from wherever it turns up. An item that
 * cannot be read at all is skipped rather than failing the whole search.
 *
 * @param document - The answer, as read.
 * @param indexer - Which indexer answered.
 * @returns What it found.
 * @throws IndexerFailure where the answer was not a feed of results.
 */
const readReleases = (document: object, indexer: ReleaseSource): Release[] => {
  const feed = FeedSchema.safeParse(document);

  if (!feed.success) {
    throw new IndexerFailure('The indexer answered a search with something that was not results');
  }

  return feed.data.rss.channel.item.flatMap((raw) => {
    const read = ItemSchema.safeParse(raw);

    if (!read.success || read.data.title.trim() === '') {
      return [];
    }

    const item = read.data;
    const attribute = (name: string) => item.attr.find((one) => one['@name'] === name)?.['@value'];
    const attributes = (name: string) =>
      item.attr.filter((one) => one['@name'] === name).map((one) => one['@value']);

    const seeders = whole(attribute('seeders'));
    const peers = whole(attribute('peers'));
    const leechers =
      whole(attribute('leechers')) ?? (peers === null ? null : Math.max(peers - (seeders ?? 0), 0));
    const link = item.link ?? item.enclosure?.['@url'] ?? null;
    const magnet =
      attribute('magneturl') ?? (link?.startsWith('magnet:') === true ? link : undefined) ?? null;
    const published = item.pubDate === undefined ? Number.NaN : Date.parse(item.pubDate);
    const identity = item.guid ?? link ?? item.title;

    return [
      {
        id: createHash('sha1').update(`${indexer.id}:${identity}`).digest('hex'),
        title: item.title.trim(),
        indexerId: indexer.id,
        indexerName: indexer.name,
        protocol: indexer.kind === 'torznab' ? ('torrent' as const) : ('usenet' as const),
        sizeBytes:
          whole(attribute('size')) ?? whole(item.size) ?? whole(item.enclosure?.['@length']),
        seeders,
        leechers,
        grabs: whole(attribute('grabs')),
        publishedAt: Number.isNaN(published) ? null : new Date(published).toISOString(),
        categories: [
          ...new Set(
            [...attributes('category'), ...item.category].flatMap((one) => whole(one) ?? []),
          ),
        ],
        downloadUrl:
          item.enclosure?.['@url'] ?? (link === null || link.startsWith('magnet:') ? null : link),
        magnetUrl: magnet,
        infoUrl: item.comments ?? null,
        infoHash: attribute('infohash') ?? null,
      },
    ];
  });
};

export type { ReleaseSource };

export { readReleases };
