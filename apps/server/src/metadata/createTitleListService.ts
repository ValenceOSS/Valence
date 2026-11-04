import { and, eq, isNull, or } from 'drizzle-orm';
import { library, mediaItem } from '#dialect/Schema';
import { sortKeyOf } from '@ValenceCore/functions/sortKeyOf';
import { SUMMARY_COLUMNS } from '@ValenceServer/library/SUMMARY_COLUMNS';
import { summaryOfRow } from '@ValenceServer/library/summaryOfRow';
import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { readJson } from '@ValenceCore/functions/readJson';
import { z } from 'zod';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type {
  TitlePage,
  TitleRow,
  TitleValueField,
  TitleValues,
} from '@ValenceContracts/schemas/TitleList';

type TitleListOptions = {
  libraryId?: string;
  sort: 'title' | 'added';
  search?: string;
  after?: string;
  limit: number;
};

const CursorSchema = z.tuple([z.string(), z.string()]);

const WordsSchema = z.array(z.string()).catch([]);

/**
 * Reads where a page left off from the cursor it handed out.
 *
 * @param after - The cursor.
 * @returns The sort value and key it stopped at, or nothing where it cannot be read.
 */
const readCursor = (after: string | undefined): [string, string] | null => {
  if (after === undefined) {
    return null;
  }

  const read = CursorSchema.safeParse(readJson(Buffer.from(after, 'base64url').toString('utf8')));

  return read.success ? read.data : null;
};

/**
 * Lists a library's films and programmes for the admin's Media, each as one row however many files
 * it is, a page at a time in the order asked; reads every file of one title; and counts the words
 * in use in a field, for suggesting them.
 *
 * @param db - The database.
 * @returns The service.
 */
const createTitleListService = (db: AnyValenceDatabase) => {
  /**
   * Reads every file of the libraries asked about, as little of each as a title row needs.
   *
   * @param libraryId - The library, or every one where none is named.
   * @returns The files.
   */
  const readFiles = (libraryId: string | undefined) =>
    db
      .select({
        id: mediaItem.id,
        libraryId: mediaItem.libraryId,
        title: mediaItem.title,
        sortTitle: mediaItem.sortTitle,
        year: mediaItem.year,
        seriesId: mediaItem.seriesId,
        seriesTitle: mediaItem.seriesTitle,
        seriesSortTitle: mediaItem.seriesSortTitle,
        seasonNumber: mediaItem.seasonNumber,
        parentId: mediaItem.parentId,
        sizeBytes: mediaItem.sizeBytes,
        addedAt: mediaItem.addedAt,
        externalId: mediaItem.externalId,
        posterUrl: mediaItem.posterUrl,
      })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(
        and(
          isNull(mediaItem.extraKind),
          eq(library.isStreamed, false),
          isStillThere(),
          libraryId === undefined ? undefined : eq(mediaItem.libraryId, libraryId),
        ),
      );

  type File = Awaited<ReturnType<typeof readFiles>>[number];

  /**
   * Gathers files into the titles they make up: a film with its versions, a programme with its
   * episodes.
   *
   * @param files - The files.
   * @returns Each title, with what it is put in order by.
   */
  const gather = (files: readonly File[]): (TitleRow & { sortKey: string })[] => {
    const titles = new Map<string, { files: File[]; lead: File }>();

    for (const file of files) {
      const key =
        file.seriesTitle === null
          ? `film:${file.parentId ?? file.id}`
          : `show:${file.seriesId ?? `${file.libraryId}:${file.seriesTitle}`}`;
      const held = titles.get(key);

      if (held === undefined) {
        titles.set(key, { files: [file], lead: file });
      } else {
        held.files.push(file);

        if (key.startsWith('film:') ? file.parentId === null : file.addedAt < held.lead.addedAt) {
          held.lead = file;
        }
      }
    }

    return [...titles.entries()].map(([key, { files: held, lead }]) => {
      const isShow = lead.seriesTitle !== null;
      const name = isShow ? (lead.seriesTitle ?? lead.title) : lead.title;

      return {
        key,
        kind: isShow ? 'show' : 'film',
        libraryId: lead.libraryId,
        leadId: lead.id,
        title: name,
        sortKey: sortKeyOf(name, isShow ? lead.seriesSortTitle : lead.sortTitle),
        year: lead.year,
        files: held.length,
        seasons: new Set(
          held.flatMap((one) => (one.seasonNumber === null ? [] : [one.seasonNumber])),
        ).size,
        sizeBytes: held.reduce((sum, one) => sum + one.sizeBytes, 0),
        latestAddedAt: held
          .map((one) => one.addedAt)
          .reduce((latest, one) => (one > latest ? one : latest))
          .toISOString(),
        isMatched: held.some((one) => one.externalId !== null && one.externalId !== ''),
        hasPoster: lead.posterUrl !== null,
      };
    });
  };

  /**
   * Lists a page of titles, in order by name or newest first, from where the last page stopped.
   *
   * @param options - Which library, the order, what to search for, where to start and how many.
   * @returns The page, and where the next one starts where there is one.
   */
  const list = async (options: TitleListOptions): Promise<TitlePage> => {
    const words = options.search?.trim().toLocaleLowerCase() ?? '';
    const titles = gather(await readFiles(options.libraryId)).filter(
      (one) => words === '' || one.title.toLocaleLowerCase().includes(words),
    );
    const valueOf = (one: TitleRow & { sortKey: string }) =>
      options.sort === 'added' ? one.latestAddedAt : one.sortKey;
    const sorted = titles.sort((left, right) => {
      const byValue =
        options.sort === 'added'
          ? valueOf(right).localeCompare(valueOf(left))
          : valueOf(left).localeCompare(valueOf(right));

      return byValue === 0 ? left.key.localeCompare(right.key) : byValue;
    });
    const cursor = readCursor(options.after);
    const start =
      cursor === null
        ? 0
        : sorted.findIndex((one) => {
            const byValue =
              options.sort === 'added'
                ? cursor[0].localeCompare(valueOf(one))
                : valueOf(one).localeCompare(cursor[0]);

            return byValue > 0 || (byValue === 0 && one.key.localeCompare(cursor[1]) > 0);
          });
    const page = start < 0 ? [] : sorted.slice(start, start + options.limit);
    const last = page.at(-1);
    const hasMore = start >= 0 && start + options.limit < sorted.length;

    return {
      titles: page.map(({ sortKey: _sortKey, ...row }) => row),
      next:
        hasMore && last !== undefined
          ? Buffer.from(JSON.stringify([valueOf(last), last.key]), 'utf8').toString('base64url')
          : null,
    };
  };

  /**
   * Reads every file of the title one file belongs to: a film's versions, or a programme's episodes.
   *
   * @param mediaId - One file of the title.
   * @returns The files, or nothing where there is no such file.
   */
  const filesOf = async (mediaId: string): Promise<MediaSummary[] | null> => {
    const [file] = await db
      .select({
        id: mediaItem.id,
        libraryId: mediaItem.libraryId,
        parentId: mediaItem.parentId,
        seriesId: mediaItem.seriesId,
        seriesTitle: mediaItem.seriesTitle,
      })
      .from(mediaItem)
      .where(eq(mediaItem.id, mediaId))
      .limit(1);

    if (file === undefined) {
      return null;
    }

    const root = file.parentId ?? file.id;
    const rows = await db
      .select({
        ...SUMMARY_COLUMNS,
        sizeBytes: mediaItem.sizeBytes,
        parentId: mediaItem.parentId,
        versionLabel: mediaItem.versionLabel,
      })
      .from(mediaItem)
      .where(
        and(
          eq(mediaItem.libraryId, file.libraryId),
          isNull(mediaItem.extraKind),
          isStillThere(),
          file.seriesTitle === null
            ? or(eq(mediaItem.id, root), eq(mediaItem.parentId, root))
            : file.seriesId === null
              ? eq(mediaItem.seriesTitle, file.seriesTitle)
              : eq(mediaItem.seriesId, file.seriesId),
        ),
      );

    return rows.map(summaryOfRow);
  };

  /**
   * Counts the words in use in one field across a library's titles, each title counted once
   * however many files it is, most used first.
   *
   * @param field - The field.
   * @param libraryId - The library, or every one where none is named.
   * @returns The words and how many titles use each.
   */
  const values = async (field: TitleValueField, libraryId?: string): Promise<TitleValues> => {
    const rows = await db
      .select({
        id: mediaItem.id,
        parentId: mediaItem.parentId,
        seriesId: mediaItem.seriesId,
        words: mediaItem[field],
      })
      .from(mediaItem)
      .where(
        and(
          isNull(mediaItem.extraKind),
          isStillThere(),
          libraryId === undefined ? undefined : eq(mediaItem.libraryId, libraryId),
        ),
      );
    const titlesOf = new Map<string, Set<string>>();

    for (const row of rows) {
      const title = row.seriesId ?? row.parentId ?? row.id;

      for (const word of WordsSchema.parse(row.words ?? [])) {
        const held = titlesOf.get(word) ?? new Set<string>();

        held.add(title);
        titlesOf.set(word, held);
      }
    }

    return {
      values: [...titlesOf.entries()]
        .map(([value, titles]) => ({ value, count: titles.size }))
        .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value)),
    };
  };

  return { list, filesOf, values };
};

type TitleListService = ReturnType<typeof createTitleListService>;

export type { TitleListOptions, TitleListService };

export { createTitleListService };
