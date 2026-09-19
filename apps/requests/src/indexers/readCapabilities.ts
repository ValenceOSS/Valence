import { z } from 'zod';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import type { IndexerCapabilities, IndexerSearchMode } from '@ValenceContracts/schemas/Indexer';

const NamedSchema = z.object({ '@id': z.string(), '@name': z.string().default('') });

const ModeSchema = z.union([
  z.object({
    '@available': z.string().default('no'),
    '@supportedParams': z.string().default('q'),
  }),
  z.literal('').transform(() => ({ '@available': 'no', '@supportedParams': '' })),
]);

const CapsSchema = z.object({
  caps: z.object({
    limits: z.union([z.object({ '@max': z.string().optional() }), z.literal('')]).optional(),
    searching: z
      .union([z.record(z.string(), ModeSchema), z.literal('').transform(() => ({}))])
      .default({}),
    categories: z
      .union([
        z.object({
          category: z
            .array(NamedSchema.extend({ subcat: z.array(NamedSchema).default([]) }))
            .default([]),
        }),
        z.literal('').transform(() => ({ category: [] })),
      ])
      .default({ category: [] }),
  }),
});

const MODES: Record<string, IndexerSearchMode> = {
  search: 'search',
  'tv-search': 'tv',
  'movie-search': 'movie',
  'music-search': 'music',
  'audio-search': 'music',
  'book-search': 'book',
};

/**
 * Reads a number an indexer wrote as text, or nothing where it wrote none that makes sense.
 *
 * @param text - What it wrote.
 * @returns The number.
 */
const readWhole = (text: string | undefined): number | null => {
  const value = Number.parseInt(text ?? '', 10);

  return Number.isFinite(value) && value > 0 ? value : null;
};

/**
 * Reads what an indexer said it can do in answer to `t=caps`: its categories, which kinds of search
 * it takes and with which parameters, and how many results it will return at once.
 *
 * @param document - The answer, as read.
 * @returns What it can do.
 * @throws IndexerFailure where the answer was not a capabilities document.
 */
const readCapabilities = (document: object): IndexerCapabilities => {
  const read = CapsSchema.safeParse(document);

  if (!read.success) {
    throw new IndexerFailure('The indexer did not say what it can search');
  }

  const { caps } = read.data;
  const modes = new Map<IndexerSearchMode, string[]>();

  for (const [tag, support] of Object.entries(caps.searching)) {
    const mode = MODES[tag];

    if (mode !== undefined && support['@available'] === 'yes' && !modes.has(mode)) {
      modes.set(
        mode,
        support['@supportedParams']
          .split(',')
          .map((parameter) => parameter.trim())
          .filter((parameter) => parameter !== ''),
      );
    }
  }

  return {
    categories: caps.categories.category.flatMap((category) => {
      const id = readWhole(category['@id']);

      return id === null
        ? []
        : [
            {
              id,
              name: category['@name'],
              subcategories: category.subcat.flatMap((sub) => {
                const subId = readWhole(sub['@id']);

                return subId === null ? [] : [{ id: subId, name: sub['@name'] }];
              }),
            },
          ];
    }),
    modes: [...modes].map(([mode, parameters]) => ({ mode, parameters })),
    limit: typeof caps.limits === 'object' ? readWhole(caps.limits['@max']) : null,
  };
};

export { readCapabilities };
