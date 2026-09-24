import { z } from 'zod';
import { plainly } from '@ValenceServer/text/plainly';

const MANGADEX = 'https://api.mangadex.org';

const PAGE = 500;

const MOST_PAGES = 6;

const TitlesSchema = z.record(z.string(), z.string());

const SeriesAnswerSchema = z.object({
  data: z.array(
    z.object({
      id: z.string().uuid(),
      attributes: z.object({
        title: TitlesSchema,
        altTitles: z.array(TitlesSchema).default([]),
      }),
    }),
  ),
});

const FeedAnswerSchema = z.object({
  data: z.array(
    z.object({
      attributes: z.object({
        chapter: z.string().nullable(),
        title: z.string().nullable(),
      }),
    }),
  ),
  total: z.number(),
});

/**
 * Reads an answer from MangaDex against the shape it is expected in.
 *
 * @param ask - How to fetch.
 * @param url - What to ask for.
 * @param schema - What the answer should look like.
 * @returns The answer, or nothing where it could not be had.
 */
const readFrom = async <T>(
  ask: (url: string) => Promise<Response>,
  url: string,
  schema: z.ZodType<T>,
): Promise<T | null> => {
  const answer = await ask(url).catch(() => null);

  if (answer === null || !answer.ok) {
    return null;
  }

  const read = schema.safeParse(await answer.json().catch(() => null));

  return read.success ? read.data : null;
};

/**
 * Finds what each chapter of a comic is called, from MangaDex's public catalogue, which names the
 * chapters of most manga and asks for no key. Only a series whose own title or one of its other
 * titles reads the same as the one asked for is used, so a near miss never renames anything.
 *
 * @param ask - How to fetch, which a test replaces.
 * @param series - What the series is called.
 * @returns Each chapter's name by its number, empty where the series or its names were not found.
 */
const findChapterNames = async (
  ask: (url: string) => Promise<Response>,
  series: string,
): Promise<ReadonlyMap<number, string>> => {
  const names = new Map<number, string>();
  const wanted = plainly(series);

  if (wanted === '') {
    return names;
  }

  const query = new URLSearchParams({ title: series, limit: '10' });
  const found = await readFrom(ask, `${MANGADEX}/manga?${query.toString()}`, SeriesAnswerSchema);
  const match = found?.data.find((one) =>
    [one.attributes.title, ...one.attributes.altTitles]
      .flatMap((titles) => Object.values(titles))
      .some((title) => plainly(title) === wanted),
  );

  if (match === undefined) {
    return names;
  }

  for (let page = 0; page < MOST_PAGES; page += 1) {
    const feed = new URLSearchParams({
      'translatedLanguage[]': 'en',
      'order[chapter]': 'asc',
      limit: PAGE.toString(),
      offset: (page * PAGE).toString(),
    });
    const read = await readFrom(
      ask,
      `${MANGADEX}/manga/${match.id}/feed?${feed.toString()}`,
      FeedAnswerSchema,
    );

    if (read === null) {
      break;
    }

    for (const { attributes } of read.data) {
      const number = Number(attributes.chapter);
      const title = attributes.title?.trim() ?? '';

      if (attributes.chapter !== null && Number.isFinite(number) && title !== '') {
        names.set(number, names.get(number) ?? title);
      }
    }

    if ((page + 1) * PAGE >= read.total) {
      break;
    }
  }

  return names;
};

export { findChapterNames };
