/* oxlint-disable valence/no-hard-coded-strings -- Audible's own field values and query terms, read by Audible rather than by people */
import { z } from 'zod';
import type { Narration, SeriesBook } from '@ValenceContracts/schemas/MediaRequest';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const AUDIBLE = 'https://api.audible.com/1.0/catalog/products';

const AT_ONCE = 50;

const NamedSchema = z.object({ name: z.string() });

const SeriesSchema = z.object({
  product: z.object({
    title: z.string().catch(''),
    relationships: z
      .array(
        z.object({
          asin: z.string(),
          relationship_to_product: z.string().nullish(),
          relationship_type: z.string().nullish(),
          sequence: z.string().nullish(),
          sort: z.string().nullish(),
        }),
      )
      .catch([]),
  }),
});

const ProductsSchema = z.object({
  products: z
    .array(
      z.object({
        asin: z.string(),
        title: z.string().catch(''),
        authors: z.array(NamedSchema).catch([]),
        narrators: z.array(NamedSchema).catch([]),
        runtime_length_min: z.number().int().nullish(),
        format_type: z.string().nullish(),
        language: z.string().nullish(),
        release_date: z.string().nullish(),
        content_delivery_type: z.string().nullish(),
        content_type: z.string().nullish(),
      }),
    )
    .catch([]),
});

const ADAPTATION = /\s*[[(][^\])]*\bdramati[sz]ed\b[^\])]*[\])]/i;

type AudibleProduct = z.infer<typeof ProductsSchema>['products'][number];

/**
 * Whether one of Audible's products is a full-cast adaptation of a book rather than the book read
 * aloud: Audible calls it a performance, or its title says it is dramatised.
 *
 * @param product - The product.
 * @returns Whether it is an adaptation.
 */
const isAdaptation = (product: AudibleProduct): boolean =>
  product.content_type === 'Performance' || ADAPTATION.test(product.title);

/**
 * A book's title without what Audible adds to name an adaptation of it.
 *
 * @param title - The title as Audible gives it.
 * @returns The book's own title.
 */
const plainTitleOf = (title: string): string => title.replace(ADAPTATION, '').trim();

/**
 * Whether a place in a series is one of its main books, numbered whole, rather than a companion
 * between them, such as 2.5, or one it gives no place at all.
 *
 * @param position - Its place, as Audible gives it.
 * @returns Whether it is a main book.
 */
const isMainPlace = (position: string | null): boolean =>
  position !== null && /^\d+$/.test(position.trim());

/**
 * A series as Audible sells it: its name, and each of its books in order — its title, author, the
 * year it came out, its place in the series, whether it is a companion rather than a main book, and
 * each unabridged narration of it in English, with who reads it and how long it lasts. Audible lists
 * a book once for every edition and region it sells; they are taken together as one book, and as
 * one narration where the same people read it, in whatever order they are named. Nothing where Audible does not know the series.
 *
 * @param web - The way out to the web.
 * @param seriesAsin - The series' Audible id.
 * @returns The series, its books in order, or null.
 */
const readAudibleSeries = async (
  web: MusicWeb,
  seriesAsin: string,
): Promise<{ title: string; books: SeriesBook[] } | null> => {
  const series = SeriesSchema.safeParse(
    await web.json(
      `${AUDIBLE}/${encodeURIComponent(seriesAsin)}?response_groups=relationships,product_desc`,
    ),
  );

  if (!series.success) {
    return null;
  }

  const members = series.data.product.relationships.filter(
    (one) => one.relationship_to_product === 'child',
  );
  const products: AudibleProduct[] = [];

  for (let at = 0; at < members.length; at += AT_ONCE) {
    const read = ProductsSchema.safeParse(
      await web.json(
        `${AUDIBLE}?${new URLSearchParams({
          asins: members
            .slice(at, at + AT_ONCE)
            .map((one) => one.asin)
            .join(','),
          response_groups: 'contributors,product_attrs,product_desc',
        }).toString()}`,
      ),
    );

    products.push(...(read.success ? read.data.products : []));
  }

  const kept = products.filter(
    (product) =>
      product.format_type !== 'abridged' &&
      (product.language === null ||
        product.language === undefined ||
        product.language.toLowerCase() === 'english'),
  );
  const places = new Map<string, typeof kept>();

  for (const member of members) {
    const product = kept.find((one) => one.asin === member.asin);

    if (product !== undefined) {
      const place = (member.sequence ?? '').trim();
      const key = place === '' ? `title:${product.title.toLowerCase()}` : `place:${place}`;

      places.set(key, [...(places.get(key) ?? []), product]);
    }
  }

  const books = [...places].map(([key, editions]): SeriesBook | null => {
    const read = editions.filter((edition) => !isAdaptation(edition));
    const first = read[0] ?? editions[0];

    if (first === undefined) {
      return null;
    }

    const position = key.startsWith('place:') ? key.slice('place:'.length) : null;
    const readersOf = (edition: (typeof editions)[number]) =>
      edition.narrators
        .map((one) => one.name)
        .toSorted()
        .join('|');
    const narrations: Narration[] = read
      .filter(
        (edition, at) => read.findIndex((other) => readersOf(other) === readersOf(edition)) === at,
      )
      .map((edition) => ({
        asin: edition.asin,
        narrators: edition.narrators.map((one) => one.name),
        runtimeMinutes:
          (edition.runtime_length_min ?? 0) > 0 ? (edition.runtime_length_min ?? null) : null,
        series: series.data.product.title === '' ? null : series.data.product.title,
        seriesAsin,
        seriesPosition: position,
      }));

    return {
      asin: first.asin,
      title: plainTitleOf(first.title),
      position,
      isCompanion: !isMainPlace(position),
      author: first.authors[0]?.name ?? null,
      year:
        first.release_date === null || first.release_date === undefined
          ? null
          : Number(first.release_date.slice(0, 4)) || null,
      openLibraryId: null,
      coverUrl: null,
      narrations,
    };
  });

  return {
    title: series.data.product.title,
    books: books
      .filter((book): book is SeriesBook => book !== null)
      .toSorted(
        (left, right) =>
          Number(left.position ?? Number.POSITIVE_INFINITY) -
            Number(right.position ?? Number.POSITIVE_INFINITY) ||
          left.title.localeCompare(right.title),
      ),
  };
};

export { readAudibleSeries };
