/* oxlint-disable valence/no-hard-coded-strings -- Audible's own query terms, which its catalogue reads in English */
import { z } from 'zod';
import type { Narration } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const MOST_NARRATIONS = 5;

const NamedSchema = z.object({ name: z.string() });

const AudibleProductsSchema = z.object({
  products: z
    .array(
      z.object({
        asin: z.string(),
        title: z.string().catch(''),
        authors: z.array(NamedSchema).catch([]),
        format_type: z.string().nullish(),
      }),
    )
    .catch([]),
});

const AudnexusBookSchema = z.object({
  asin: z.string(),
  formatType: z.string().nullish(),
  runtimeLengthMin: z.number().int().positive().nullish(),
  narrators: z.array(NamedSchema).catch([]),
  seriesPrimary: z.object({ name: z.string() }).nullish().catch(null),
});

/**
 * Words of a title or a name, lower case and without punctuation, for telling one book from
 * another whatever the shop calls it.
 *
 * @param text - The title or name.
 * @returns Its words.
 */
const wordsOf = (text: string): string =>
  text
    .toLowerCase()
    .split(':')[0]
    ?.replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim() ?? '';

/**
 * The unabridged narrations of a book Audible sells, each with its narrators, how long it lasts and
 * the series it is part of: found on Audible's catalogue by title and author, then read from
 * Audnexus, which keeps Audible's details of each. Nothing where neither answers, so a request
 * checks no length rather than refusing every release.
 *
 * @param web - The way out to the web.
 * @param title - The book's title.
 * @param author - Who wrote it, where known.
 * @returns Its narrations, the closest matches first.
 */
const readNarrations = async (
  web: MusicWeb,
  title: string,
  author: string | null,
): Promise<Narration[]> => {
  const found = AudibleProductsSchema.safeParse(
    await web.json(
      `https://api.audible.com/1.0/catalog/products?${new URLSearchParams({
        title,
        ...(author === null ? {} : { author }),
        num_results: '10',
        products_sort_by: 'Relevance',
        response_groups: 'contributors,product_desc,product_attrs',
      }).toString()}`,
    ),
  );

  if (!found.success) {
    return [];
  }

  const wanted = wordsOf(title);
  const by = author === null ? null : (wordsOf(author).split(' ').at(-1) ?? null);
  const asins = found.data.products
    .filter(
      (product) =>
        product.format_type !== 'abridged' &&
        wordsOf(product.title) === wanted &&
        (by === null || product.authors.some((one) => wordsOf(one.name).split(' ').includes(by))),
    )
    .map((product) => product.asin)
    .slice(0, MOST_NARRATIONS);
  const narrations: Narration[] = [];

  for (const asin of asins) {
    const read = AudnexusBookSchema.safeParse(
      await web.json(`https://api.audnex.us/books/${encodeURIComponent(asin)}`),
    );

    if (read.success && read.data.formatType !== 'abridged') {
      narrations.push({
        asin,
        narrators: read.data.narrators.map((narrator) => narrator.name),
        runtimeMinutes: read.data.runtimeLengthMin ?? null,
        series: read.data.seriesPrimary?.name ?? null,
      });
    }
  }

  return narrations.filter(
    (narration, at) =>
      narrations.findIndex(
        (other) => other.narrators.join('|') === narration.narrators.join('|'),
      ) === at,
  );
};

export { readNarrations };
