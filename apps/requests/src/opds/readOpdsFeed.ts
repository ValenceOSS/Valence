import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import type { OpdsEntry, OpdsFeed, OpdsLink } from '@ValenceRequests/opds/OpdsEntry';
import { saying } from '@ValenceI18n/saying';

const ACQUISITION = 'http://opds-spec.org/acquisition';

const NOT_A_DOWNLOAD = new Set(['borrow', 'buy', 'sample', 'preview', 'subscribe', 'indirect']);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  removeNSPrefix: true,
  isArray: (name) => name === 'entry' || name === 'link' || name === 'author',
});

const TextSchema = z.union([
  z.string(),
  z.number().transform(String),
  z
    .object({ '#text': z.union([z.string(), z.number().transform(String)]) })
    .transform((text) => text['#text']),
]);

const LinkSchema = z.object({
  '@href': z.string(),
  '@rel': z.string().optional(),
  '@type': z.string().optional(),
  '@length': z.union([z.string(), z.number()]).optional(),
});

const EntrySchema = z.object({
  id: TextSchema.optional(),
  title: TextSchema.optional(),
  updated: TextSchema.optional(),
  author: z.array(z.object({ name: TextSchema.optional() }).passthrough()).optional(),
  link: z.array(LinkSchema).optional(),
});

const FeedSchema = z.object({
  feed: z.object({
    link: z.array(LinkSchema).optional(),
    entry: z.array(EntrySchema).optional(),
  }),
});

/**
 * Whether a link's relation says it hands over the book itself, rather than lending, selling or
 * previewing it.
 *
 * @param rel - The link's relation.
 * @returns Whether it is a download.
 */
const isDownload = (rel: string | undefined): boolean =>
  rel !== undefined &&
  rel.startsWith(ACQUISITION) &&
  !NOT_A_DOWNLOAD.has(rel.slice(ACQUISITION.length + 1).split('/')[0] ?? '');

/**
 * Reads an OPDS catalogue's Atom feed: where its search is described, each book in it with the
 * links that download it, and — for a book listed only by a link to a feed of its own, as some
 * catalogues answer a search — that feed's address, every address made whole against the feed's
 * own.
 *
 * @param xml - The feed.
 * @param feedUrl - Where it was read from.
 * @returns The feed.
 */
const readOpdsFeed = (xml: string, feedUrl: string): OpdsFeed => {
  const read = FeedSchema.safeParse(parser.parse(xml));

  if (!read.success) {
    throw new IndexerFailure(saying('requests.opds.readOpdsFeed.theAddressIsNotAnOPDS'));
  }

  const whole = (href: string): string | null => URL.parse(href, feedUrl)?.toString() ?? null;
  const search = (read.data.feed.link ?? []).find((link) => link['@rel'] === 'search');
  const searchHref = search === undefined ? null : whole(search['@href']);

  const bookFeeds = (read.data.feed.entry ?? []).flatMap((entry): string[] => {
    const links = entry.link ?? [];
    const own = links.find(
      (link) =>
        (link['@type'] ?? '').startsWith('application/atom+xml') &&
        (link['@rel'] === undefined ||
          link['@rel'] === 'subsection' ||
          link['@rel'] === 'alternate'),
    );
    const href = own === undefined ? null : whole(own['@href']);

    return links.some((link) => isDownload(link['@rel'])) || href === null ? [] : [href];
  });

  const entries = (read.data.feed.entry ?? []).flatMap((entry): OpdsEntry[] => {
    const acquisitions = (entry.link ?? []).flatMap((link): OpdsLink[] => {
      const href = whole(link['@href']);
      const length = Number(link['@length']);

      return href === null || !isDownload(link['@rel'])
        ? []
        : [
            {
              href,
              type: (link['@type'] ?? '').split(';')[0]?.trim().toLowerCase() ?? '',
              length: Number.isInteger(length) && length > 0 ? length : null,
            },
          ];
    });
    const alternate = (entry.link ?? []).find(
      (link) => link['@rel'] === 'alternate' && (link['@type'] ?? '').startsWith('text/html'),
    );

    return entry.title === undefined || acquisitions.length === 0
      ? []
      : [
          {
            id: entry.id ?? acquisitions[0]?.href ?? entry.title,
            title: entry.title.trim(),
            authors: (entry.author ?? []).flatMap((author) =>
              author.name === undefined ? [] : [author.name.trim()],
            ),
            updatedAt: entry.updated ?? null,
            infoUrl: alternate === undefined ? null : whole(alternate['@href']),
            acquisitions,
          },
        ];
  });

  return {
    searchLink:
      search === undefined || searchHref === null
        ? null
        : { href: searchHref, type: search['@type'] ?? '' },
    entries,
    bookFeeds,
  };
};

export { readOpdsFeed };
