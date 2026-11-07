import { z } from 'zod';
import { openLibraryCover } from '@ValenceServer/requests/openLibrary/openLibraryCover';
import { openLibraryIdOf } from '@ValenceServer/requests/openLibrary/openLibraryIdOf';
import type { BookAbout } from '@ValenceContracts/schemas/BookAbout';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';
import type { OpenLibraryBook } from '@ValenceServer/requests/openLibrary/OpenLibraryBook';

const MOST_SUBJECTS_KEPT = 10;

const MOST_PUBLISHERS_KEPT = 3;

const MOST_LANGUAGES_KEPT = 3;

const LANGUAGE_NAMES = new Intl.DisplayNames(['en'], { type: 'language' });

const MOST_LISTED = 16;

const ENOUGH_ALIKE = 8;

const MOST_WIDER_ASKS = 2;

const FOUND_FIELDS = [
  'key',
  'title',
  'author_name',
  'author_key',
  'first_publish_year',
  'cover_i',
  'number_of_pages_median',
  'publisher',
  'edition_count',
  'ratings_average',
  'ratings_count',
  'want_to_read_count',
  'currently_reading_count',
  'already_read_count',
  'subject',
  'language',
].join(',');

const LISTED_FIELDS = 'key,title,author_name,first_publish_year,cover_i';

const PLAIN_SUBJECTS = new Set([
  'fiction',
  'general',
  'literature',
  'novel',
  'novels',
  'englishliterature',
  'americanliterature',
  'largetypebooks',
  'openlibrarystaffpicks',
  'accessiblebook',
  'protecteddaisy',
  'inlibrary',
  'lendinglibrary',
  'fictiongeneral',
  'socialaspects',
  'popularworks',
  'newyorktimesbestseller',
  'bestsellers',
  'history',
  'criticismandinterpretation',
]);

const FoundSchema = z.object({
  key: z.string(),
  title: z.string().min(1),
  author_name: z.array(z.string()).nullish().catch(null),
  author_key: z.array(z.string()).nullish().catch(null),
  first_publish_year: z.number().int().nullish().catch(null),
  cover_i: z.number().int().nullish().catch(null),
  number_of_pages_median: z.number().int().nullish().catch(null),
  publisher: z.array(z.string()).nullish().catch(null),
  edition_count: z.number().int().nullish().catch(null),
  ratings_average: z.number().nullish().catch(null),
  ratings_count: z.number().int().nullish().catch(null),
  want_to_read_count: z.number().int().nullish().catch(null),
  currently_reading_count: z.number().int().nullish().catch(null),
  already_read_count: z.number().int().nullish().catch(null),
  subject: z.array(z.string()).nullish().catch(null),
  language: z.array(z.string()).nullish().catch(null),
});

const SearchSchema = z.object({
  docs: z.array(FoundSchema.nullable().catch(null)).catch([]),
});

const ListedSchema = z.object({
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

const WrittenSchema = z
  .union([z.string(), z.object({ value: z.string() }).transform((wrapped) => wrapped.value)])
  .nullish()
  .catch(null);

const WorkSchema = z.object({ description: WrittenSchema });

const AuthorSchema = z.object({
  name: z.string().min(1),
  bio: WrittenSchema,
  birth_date: z.string().nullish().catch(null),
  death_date: z.string().nullish().catch(null),
  photos: z.array(z.number().int()).nullish().catch(null),
});

const AuthorWorksSchema = z.object({ size: z.number().int().nullish().catch(null) });

type OpenLibraryAbout = Omit<BookAbout, 'byAuthor' | 'alike'> & {
  byAuthor: OpenLibraryBook[];
  alike: OpenLibraryBook[];
};

/**
 * A title as it is compared with another: lower case, without what follows a colon or a bracket,
 * and without anything that is not a letter or a number.
 *
 * @param title - The title.
 * @returns Its key.
 */
const keyOf = (title: string): string =>
  title
    .toLowerCase()
    .split(/[:([]/u)[0]
    ?.replace(/[^\p{L}\p{N}]+/gu, '') ?? '';

/**
 * What somebody wrote, tidied: Open Library's prose often ends in a list of links or a source line
 * below a row of dashes, which is not part of it.
 *
 * @param written - What Open Library said.
 * @returns The prose, or null where there is none.
 */
const proseOf = (written: string | null | undefined): string | null => {
  const prose = (written ?? '').split(/\n-{3,}|\n\(\[source\]|\n\[source\]/u)[0]?.trim() ?? '';

  return prose === '' ? null : prose;
};

/**
 * The languages a work has been published in, named, English first and the rest as Open Library
 * lists them, leaving out any code it cannot name.
 *
 * @param codes - Open Library's three-letter codes for them.
 * @returns Their names.
 */
const languagesOf = (codes: readonly string[]): string[] =>
  [...codes]
    .sort((one, other) => Number(other === 'eng') - Number(one === 'eng'))
    .flatMap((code) => {
      try {
        const name = LANGUAGE_NAMES.of(code);

        return name === undefined || name === code ? [] : [name];
      } catch {
        return [];
      }
    })
    .slice(0, MOST_LANGUAGES_KEPT);

/**
 * The search for works filed under a subject, by the key Open Library files it under: lower case,
 * without commas or full stops, words joined by underscores.
 *
 * @param subject - The subject, as Open Library names it.
 * @returns The search.
 */
const subjectQuery = (subject: string): string =>
  `subject_key:"${subject.toLowerCase().replace(/[,."]/gu, '').trim().replace(/\s+/gu, '_')}"`;

/**
 * Asks Open Library for a list of works in English with a cover, each as a book that can be asked
 * for.
 *
 * @param web - The way out to the web.
 * @param search - What to search for.
 * @returns The works found.
 */
const listWorks = async (
  web: MusicWeb,
  search: Record<string, string>,
): Promise<OpenLibraryBook[]> => {
  const read = ListedSchema.safeParse(
    await web.json(
      `https://openlibrary.org/search.json?${new URLSearchParams({
        ...search,
        q: `${search.q} AND language:eng`,
        limit: (MOST_LISTED * 2).toString(),
        fields: LISTED_FIELDS,
      }).toString()}`,
    ),
  );

  return read.success
    ? read.data.docs.flatMap((doc) => {
        const openLibraryId = doc === null ? null : openLibraryIdOf(doc.key);

        const coverUrl = doc === null ? null : openLibraryCover(doc.cover_i);

        return doc === null || openLibraryId === null || coverUrl === null
          ? []
          : [
              {
                openLibraryId,
                title: doc.title,
                author: doc.author_name?.[0] ?? null,
                year: doc.first_publish_year ?? null,
                coverUrl,
              },
            ];
      })
    : [];
};

/**
 * Finds a book in Open Library by its title and who wrote it, and reads everything Open Library
 * knows of it: what it is about and what it is filed under, when it was first published, how long
 * it is and who published it, how readers rated it and how many are reading it, who wrote it — their
 * life and how much they wrote — the books they are best known for, and the books most read among
 * those filed under the same subjects.
 *
 * @param web - The way out to the web.
 * @param title - The book's title.
 * @param author - Who wrote it, where that is known.
 * @returns What Open Library knows, or null where it does not know the book or could not be asked.
 */
const readOpenLibraryAbout = async (
  web: MusicWeb,
  title: string,
  author: string | null,
): Promise<OpenLibraryAbout | null> => {
  const byFields = SearchSchema.safeParse(
    await web.json(
      `https://openlibrary.org/search.json?${new URLSearchParams({
        title,
        ...(author === null ? {} : { author }),
        limit: '5',
        fields: FOUND_FIELDS,
      }).toString()}`,
    ),
  );
  const found =
    byFields.success && byFields.data.docs.some((doc) => doc !== null)
      ? byFields
      : SearchSchema.safeParse(
          await web.json(
            `https://openlibrary.org/search.json?${new URLSearchParams({
              q: author === null ? title : `${title} ${author}`,
              limit: '5',
              fields: FOUND_FIELDS,
            }).toString()}`,
          ),
        );
  const docs = found.success ? found.data.docs.flatMap((doc) => (doc === null ? [] : [doc])) : [];
  const book = docs.find((doc) => keyOf(doc.title) === keyOf(title)) ?? docs[0];
  const openLibraryId = book === undefined ? null : openLibraryIdOf(book.key);

  if (book === undefined || openLibraryId === null) {
    return null;
  }

  const authorKey = book.author_key?.[0] ?? null;
  const subjects = (book.subject ?? [])
    .filter(
      (subject) =>
        !PLAIN_SUBJECTS.has(subject.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')) &&
        !subject.includes(':') &&
        !subject.includes('/'),
    )
    .filter((subject) => subject.length <= 40)
    .slice(0, MOST_SUBJECTS_KEPT);
  const titleWords = new Set(
    title
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length > 3),
  );
  const isNamedInTitle = (subject: string) =>
    subject
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .some(
        (word) =>
          titleWords.has(word) ||
          titleWords.has(`${word}s`) ||
          titleWords.has(word.replace(/s$/u, '')),
      );
  const named = subjects.filter(isNamedInTitle);
  const askedOf = named.length > 0 ? named.slice(0, 1) : subjects.slice(0, 2);

  const work = WorkSchema.safeParse(
    await web.json(`https://openlibrary.org/works/OL${openLibraryId.toString()}W.json`),
  );
  const writer =
    authorKey === null
      ? null
      : AuthorSchema.safeParse(await web.json(`https://openlibrary.org/authors/${authorKey}.json`));
  const authorWorks =
    authorKey === null
      ? null
      : AuthorWorksSchema.safeParse(
          await web.json(`https://openlibrary.org/authors/${authorKey}/works.json?limit=1`),
        );
  const byAuthor =
    authorKey === null
      ? []
      : (await listWorks(web, { q: `author_key:${authorKey}`, sort: 'readinglog' })).filter(
          (one, at, every) =>
            !keyOf(one.title).includes(keyOf(title)) &&
            !keyOf(one.title).includes(keyOf(book.title)) &&
            every.findIndex((other) => keyOf(other.title) === keyOf(one.title)) === at,
        );
  const closely =
    askedOf.length === 0
      ? []
      : await listWorks(web, {
          q: askedOf.map(subjectQuery).join(' AND '),
          sort: 'readinglog',
        });
  const broadly: OpenLibraryBook[] = [];

  for (const subject of subjects
    .filter((one) => !askedOf.includes(one))
    .slice(0, MOST_WIDER_ASKS)) {
    if (closely.length + broadly.length >= ENOUGH_ALIKE) {
      break;
    }

    broadly.push(...(await listWorks(web, { q: subjectQuery(subject), sort: 'readinglog' })));
  }
  const shownIds = new Set([openLibraryId, ...byAuthor.map((one) => one.openLibraryId)]);

  const pageCount = book.number_of_pages_median ?? null;
  const ratings = book.ratings_count ?? 0;
  const photo = writer?.success === true ? writer.data.photos?.find((id) => id > 0) : undefined;

  return {
    openLibraryId: openLibraryId.toString(),
    overview: work.success ? proseOf(work.data.description) : null,
    subjects,
    firstPublished: book.first_publish_year ?? null,
    pages: pageCount !== null && pageCount > 0 ? pageCount : null,
    publishers: (book.publisher ?? []).slice(0, MOST_PUBLISHERS_KEPT),
    languages: languagesOf(book.language ?? []),
    editions: book.edition_count ?? null,
    rating:
      book.ratings_average === null || book.ratings_average === undefined || ratings === 0
        ? null
        : { average: Math.min(5, Math.max(0, book.ratings_average)), count: ratings },
    readers:
      book.want_to_read_count === null || book.want_to_read_count === undefined
        ? null
        : {
            wantToRead: book.want_to_read_count,
            reading: book.currently_reading_count ?? 0,
            haveRead: book.already_read_count ?? 0,
          },
    author:
      writer === null || !writer.success
        ? null
        : {
            name: writer.data.name,
            bio: proseOf(writer.data.bio),
            photoUrl:
              photo === undefined
                ? null
                : `https://covers.openlibrary.org/a/id/${photo.toString()}-M.jpg`,
            born: writer.data.birth_date ?? null,
            died: writer.data.death_date ?? null,
            workCount: authorWorks?.success === true ? (authorWorks.data.size ?? null) : null,
          },
    byAuthor: byAuthor.slice(0, MOST_LISTED),
    alike: [...closely, ...broadly]
      .filter(
        (one, at, every) =>
          !shownIds.has(one.openLibraryId) &&
          !keyOf(one.title).includes(keyOf(title)) &&
          every.findIndex((other) => keyOf(other.title) === keyOf(one.title)) === at,
      )
      .slice(0, MOST_LISTED),
  };
};

export type { OpenLibraryAbout };

export { readOpenLibraryAbout };
