import { z } from 'zod';
import { openLibraryCover } from '@ValenceServer/requests/openLibrary/openLibraryCover';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const MOST_AUTHORS_NAMED = 3;

const MOST_SUBJECTS_KEPT = 8;

const WorkSchema = z.object({
  title: z.string().min(1),
  description: z
    .union([z.string(), z.object({ value: z.string() }).transform((wrapped) => wrapped.value)])
    .nullish()
    .catch(null),
  subjects: z.array(z.string()).nullish().catch(null),
  covers: z.array(z.number().int()).nullish().catch(null),
  first_publish_date: z.string().nullish().catch(null),
  authors: z
    .array(z.object({ author: z.object({ key: z.string() }).nullish().catch(null) }))
    .nullish()
    .catch(null),
});

const AuthorSchema = z.object({ name: z.string().min(1) });

type OpenLibraryDescription = {
  title: string;
  year: number | null;
  overview: string | null;
  posterUrl: string | null;
  authors: string[];
  subjects: string[];
};

/**
 * The year a work was first published, out of the date Open Library gives, which is free text such
 * as `1965`, `May 1965` or `1965-05-01`.
 *
 * @param date - What Open Library said.
 * @returns The year, or null where none can be read from it.
 */
const yearOf = (date: string | null | undefined): number | null => {
  const found = /\b(1[0-9]{3}|20[0-9]{2})\b/.exec(date ?? '');

  return found === null ? null : Number(found[1]);
};

/**
 * Reads everything Open Library says of one work — its title, what it is about, its subjects, when
 * it was first published, its cover, and who wrote it — the authors being a further question each,
 * since a work names them only by key.
 *
 * @param web - The way out to the web.
 * @param openLibraryId - The number the work goes by.
 * @returns The work, or null where Open Library does not know it or could not be asked.
 */
const describeOpenLibraryBook = async (
  web: MusicWeb,
  openLibraryId: number,
): Promise<OpenLibraryDescription | null> => {
  const read = WorkSchema.safeParse(
    await web.json(`https://openlibrary.org/works/OL${openLibraryId.toString()}W.json`),
  );

  if (!read.success) {
    return null;
  }

  const authorKeys = (read.data.authors ?? [])
    .flatMap((entry) =>
      entry.author === null || entry.author === undefined ? [] : [entry.author.key],
    )
    .slice(0, MOST_AUTHORS_NAMED);

  const authors = await Promise.all(
    authorKeys.map(async (key) => {
      const named = AuthorSchema.safeParse(await web.json(`https://openlibrary.org${key}.json`));

      return named.success ? [named.data.name] : [];
    }),
  );

  const description = read.data.description?.trim() ?? '';

  return {
    title: read.data.title,
    year: yearOf(read.data.first_publish_date),
    overview: description === '' ? null : description,
    posterUrl: openLibraryCover(read.data.covers?.find((cover) => cover > 0)),
    authors: authors.flat(),
    subjects: (read.data.subjects ?? []).slice(0, MOST_SUBJECTS_KEPT),
  };
};

export type { OpenLibraryDescription };

export { describeOpenLibraryBook };
