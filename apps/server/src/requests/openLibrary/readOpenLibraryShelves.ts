import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import { z } from 'zod';
import { openLibraryCover } from '@ValenceServer/requests/openLibrary/openLibraryCover';
import { openLibraryIdOf } from '@ValenceServer/requests/openLibrary/openLibraryIdOf';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';
import type { OpenLibraryBook } from '@ValenceServer/requests/openLibrary/OpenLibraryBook';

const MOST_ON_A_SHELF = 20;

const SHELVES = [
  { id: 'trending-books', titleKey: 'server.shelves.trendingBooks', from: 'trending' },
  {
    id: 'science-fiction-books',
    titleKey: 'server.shelves.scienceFiction',
    from: 'science_fiction',
  },
  { id: 'fantasy-books', titleKey: 'server.shelves.fantasy', from: 'fantasy' },
  {
    id: 'mystery-books',
    titleKey: 'server.shelves.mystery',
    from: 'mystery_and_detective_stories',
  },
  { id: 'history-books', titleKey: 'server.shelves.history', from: 'history' },
] as const satisfies readonly { id: string; titleKey: StringKey; from: string }[];

const TrendingSchema = z.object({
  works: z
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

const SubjectSchema = z.object({
  works: z
    .array(
      z
        .object({
          key: z.string(),
          title: z.string().min(1),
          authors: z
            .array(z.object({ name: z.string() }))
            .nullish()
            .catch(null),
          first_publish_year: z.number().int().nullish().catch(null),
          cover_id: z.number().int().nullish().catch(null),
        })
        .nullable()
        .catch(null),
    )
    .catch([]),
});

type OpenLibraryShelf = { id: string; title: string; books: OpenLibraryBook[] };

/**
 * Reads the shelves of books to ask for: what is being read most this week, and the best known of a
 * few subjects, from Open Library, which needs no key and is told nothing about who is asking. A
 * shelf Open Library could not be asked for, or that came back empty, is left out.
 *
 * @param web - The way out to the web.
 * @returns The shelves, in the order they are shown.
 */
const readOpenLibraryShelves = async (web: MusicWeb): Promise<OpenLibraryShelf[]> => {
  const shelves = await Promise.all(
    SHELVES.map(async (shelf): Promise<OpenLibraryShelf> => {
      if (shelf.from === 'trending') {
        const read = TrendingSchema.safeParse(
          await web.json(
            `https://openlibrary.org/trending/weekly.json?limit=${MOST_ON_A_SHELF.toString()}`,
          ),
        );

        return {
          id: shelf.id,
          title: say(shelf.titleKey),
          books: read.success
            ? read.data.works.flatMap((work) => {
                const openLibraryId = work === null ? null : openLibraryIdOf(work.key);

                return work === null || openLibraryId === null
                  ? []
                  : [
                      {
                        openLibraryId,
                        title: work.title,
                        author: work.author_name?.[0] ?? null,
                        year: work.first_publish_year ?? null,
                        coverUrl: openLibraryCover(work.cover_i),
                      },
                    ];
              })
            : [],
        };
      }

      const read = SubjectSchema.safeParse(
        await web.json(
          `https://openlibrary.org/subjects/${shelf.from}.json?limit=${MOST_ON_A_SHELF.toString()}`,
        ),
      );

      return {
        id: shelf.id,
        title: say(shelf.titleKey),
        books: read.success
          ? read.data.works.flatMap((work) => {
              const openLibraryId = work === null ? null : openLibraryIdOf(work.key);

              return work === null || openLibraryId === null
                ? []
                : [
                    {
                      openLibraryId,
                      title: work.title,
                      author: work.authors?.[0]?.name ?? null,
                      year: work.first_publish_year ?? null,
                      coverUrl: openLibraryCover(work.cover_id),
                    },
                  ];
            })
          : [],
      };
    }),
  );

  return shelves.filter((shelf) => shelf.books.length > 0);
};

export type { OpenLibraryShelf };

export { readOpenLibraryShelves };
