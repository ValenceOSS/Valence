import { z } from 'zod';
import { openLibraryCover } from '@ValenceServer/requests/openLibrary/openLibraryCover';
import { openLibraryIdOf } from '@ValenceServer/requests/openLibrary/openLibraryIdOf';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';
import type { OpenLibraryBook } from '@ValenceServer/requests/openLibrary/OpenLibraryBook';

const MOST_FOUND = 20;

const FIELDS = 'key,title,author_name,first_publish_year,cover_i';

const SearchSchema = z.object({
  docs: z
    .array(
      z
        .object({
          key: z.string(),
          title: z.string().min(1),
          author_name: z.array(z.string()).nullish().catch(null),
          first_publish_year: z.number().int().nullish().catch(null),
          cover_i: z.number().int().nullish().catch(null),
        })
        .nullable()
        .catch(null),
    )
    .catch([]),
});

/**
 * Searches Open Library for books by what somebody typed — a title, an author, or both — which
 * needs no key. Each is a work, the book as a whole rather than one printing of it, since it is
 * the work somebody wants and any edition of it will do.
 *
 * @param web - The way out to the web.
 * @param query - What was typed.
 * @returns The books found, or none where Open Library could not be asked.
 */
const searchOpenLibrary = async (web: MusicWeb, query: string): Promise<OpenLibraryBook[]> => {
  const answered = await web.json(
    `https://openlibrary.org/search.json?${new URLSearchParams({
      q: query,
      limit: MOST_FOUND.toString(),
      fields: FIELDS,
    }).toString()}`,
  );
  const read = SearchSchema.safeParse(answered);

  return read.success
    ? read.data.docs.flatMap((doc) => {
        const openLibraryId = doc === null ? null : openLibraryIdOf(doc.key);

        return doc === null || openLibraryId === null
          ? []
          : [
              {
                openLibraryId,
                title: doc.title,
                author: doc.author_name?.[0] ?? null,
                year: doc.first_publish_year ?? null,
                coverUrl: openLibraryCover(doc.cover_i),
              },
            ];
      })
    : [];
};

export { searchOpenLibrary };
