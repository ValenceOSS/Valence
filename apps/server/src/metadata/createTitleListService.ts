import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { library, mediaItem, series, titleEdit } from '#dialect/Schema';
import { SUMMARY_COLUMNS } from '@ValenceServer/library/SUMMARY_COLUMNS';
import { summaryOfRow } from '@ValenceServer/library/summaryOfRow';
import type { ArtworkAddressOf } from '@ValenceServer/images/ArtworkAddressOf';
import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { heldOnThisServer } from '@ValenceServer/visibility/heldOnThisServer';
import { findDuplicates } from '@ValenceServer/health/findDuplicates';
import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { listedTitlesOf } from './listedTitlesOf';
import { pageOfTitles } from './pageOfTitles';
import { titlesAsked } from './titlesAsked';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type {
  LibraryProblems,
  TitleChoices,
  TitleFiles,
  TitleKeys,
  TitleListQuery,
  TitlePage,
  TitleValueField,
  TitleValues,
} from '@ValenceContracts/schemas/TitleList';
import type { ListedFile, ListedTitle } from './listedTitlesOf';

type TitleListDependencies = {
  certificationRegion?: () => Promise<string>;
  now?: () => Date;
  artworkAddressOf?: ArtworkAddressOf;
};

const WATCHED_KINDS = ['movies', 'shows', 'anime'];

const WordsSchema = z.array(z.string()).catch([]);

const CertificationsSchema = z.record(z.string(), z.string()).catch({});

const StreamsSchema = z.array(z.unknown()).catch([]);

const SERIES_ID = /^series (\S+) (.+)$/u;

/**
 * Counts how many titles hold each of some values, most held first.
 *
 * @param titles - The titles.
 * @param valuesOf - The values one title holds.
 * @returns Each value and how many titles hold it.
 */
const countsOf = (
  titles: readonly ListedTitle[],
  valuesOf: (title: ListedTitle) => readonly string[],
): { value: string; count: number }[] => {
  const counts = new Map<string, number>();

  for (const title of titles) {
    for (const value of new Set(valuesOf(title))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
};

/**
 * Lists a library's films and programmes for the admin's Media, one row each however many files it
 * is, searched, filtered, put in order and read a page at a time on the server; every title a
 * listing asks for, for selecting them all; the values its filter chips can take; how many titles in
 * each library need a look; every file of one title; and the words in use in a field.
 *
 * @param db - The database.
 * @param dependencies - The server's own country, whose content rating the filters read, and the
 *   time now.
 * @returns The service.
 */
const createTitleListService = (
  db: AnyValenceDatabase,
  {
    certificationRegion = () => Promise.resolve('GB'),
    now = () => new Date(),
    artworkAddressOf,
  }: TitleListDependencies = {},
) => {
  /**
   * Reads every file of one library or all of them that is not an extra, with what listing it
   * needs.
   *
   * @param libraryId - The library, or every library of films and programmes where none is named.
   * @returns The files.
   */
  const readFiles = async (libraryId: string | undefined): Promise<ListedFile[]> => {
    const region = (await certificationRegion()).trim().toUpperCase();
    const rows = await db
      .select({
        ...SUMMARY_COLUMNS,
        sizeBytes: mediaItem.sizeBytes,
        parentId: mediaItem.parentId,
        versionLabel: mediaItem.versionLabel,
        path: mediaItem.path,
        originalTitle: mediaItem.originalTitle,
        overview: mediaItem.overview,
        tags: mediaItem.tags,
        certifications: mediaItem.certifications,
        subtitleStreams: mediaItem.subtitleStreams,
        catalogueEpisodeId: mediaItem.catalogueEpisodeId,
        seriesKey: series.key,
        episodeTotal: series.episodeTotal,
      })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .leftJoin(series, eq(series.id, mediaItem.seriesId))
      .where(
        and(
          isNull(mediaItem.extraKind),
          eq(library.isStreamed, false),
          isStillThere(),
          libraryId === undefined
            ? inArray(library.kind, WATCHED_KINDS)
            : eq(mediaItem.libraryId, libraryId),
        ),
      );

    return rows.map(
      ({
        path,
        originalTitle,
        overview,
        tags,
        certifications,
        subtitleStreams,
        catalogueEpisodeId,
        seriesKey,
        episodeTotal,
        ...row
      }) => ({
        summary: summaryOfRow(row, artworkAddressOf),
        path,
        sizeBytes: row.sizeBytes,
        parentId: row.parentId,
        originalTitle,
        seriesKey,
        episodeTotal,
        catalogueEpisodeId,
        hasOverview: overview !== null && overview.trim() !== '',
        tags: WordsSchema.parse(tags ?? []),
        certification: CertificationsSchema.parse(certifications ?? {})[region] ?? null,
        hasSubtitles: StreamsSchema.parse(subtitleStreams).length > 0,
      }),
    );
  };

  /**
   * Finds every file of the libraries of films and programmes that is there more than once, and
   * where each is, so a title can say which of its files are and which other copy shares them.
   *
   * @returns Each duplicated file's group, and its path.
   */
  const readDuplicates = async () => {
    const placed = await db
      .select({
        id: mediaItem.id,
        path: mediaItem.path,
        externalId: mediaItem.externalId,
        seriesId: mediaItem.seriesId,
        seasonNumber: mediaItem.seasonNumber,
        episodeNumber: mediaItem.episodeNumber,
      })
      .from(mediaItem)
      .innerJoin(library, eq(library.id, mediaItem.libraryId))
      .where(
        and(
          isNull(mediaItem.parentId),
          isNull(mediaItem.extraKind),
          inArray(library.kind, WATCHED_KINDS),
          heldOnThisServer(),
          isStillThere(),
        ),
      );
    const duplicates = findDuplicates(placed);

    return {
      duplicates,
      duplicatePaths: new Map(
        placed.filter((one) => duplicates.has(one.id)).map((one) => [one.id, one.path]),
      ),
    };
  };

  /**
   * Lists a library's titles with everything listing them needs.
   *
   * @param libraryId - The library, or every library of films and programmes where none is named.
   * @returns The titles.
   */
  const listed = async (libraryId: string | undefined): Promise<ListedTitle[]> => {
    const [files, { duplicates, duplicatePaths }, edits] = await Promise.all([
      readFiles(libraryId),
      readDuplicates(),
      db
        .selectDistinct({ subjectKey: titleEdit.subjectKey })
        .from(titleEdit)
        .where(libraryId === undefined ? undefined : eq(titleEdit.libraryId, libraryId)),
    ]);

    return listedTitlesOf(files, {
      duplicates,
      duplicatePaths,
      editedKeys: new Set(edits.map((one) => one.subjectKey)),
    });
  };

  /**
   * Lists a page of a library's titles as a listing asks.
   *
   * @param query - The library, search, chips, quick filter and order.
   * @param after - Where the last page stopped.
   * @param limit - How many to a page.
   * @returns The page.
   */
  const list = async (
    query: TitleListQuery,
    after: string | undefined,
    limit: number,
  ): Promise<TitlePage> =>
    pageOfTitles(await listed(query.libraryId), query, after, limit, now().getTime());

  /**
   * Names every title a listing asks for, for a selection of all of them.
   *
   * @param query - The library, search, chips, quick filter and order.
   * @returns The titles.
   */
  const keys = async (query: TitleListQuery): Promise<TitleKeys> => ({
    titles: titlesAsked(await listed(query.libraryId), query, now().getTime()).shown.map(
      ({ row }) => ({ id: row.id, leadId: row.lead.id, kind: row.kind, name: row.name }),
    ),
  });

  /**
   * Says what a library's filter chips can be set to, with how many titles each would show.
   *
   * @param libraryId - The library.
   * @returns The values of each kind of chip.
   */
  const choices = async (libraryId: string): Promise<TitleChoices> => {
    const titles = await listed(libraryId);

    return {
      filters: [
        {
          kind: 'resolution',
          values: countsOf(titles, (title) =>
            title.files.map((file) => sharpestStepOf(file.summary)?.label ?? ''),
          )
            .filter((one) => one.value !== '')
            .sort(
              (left, right) =>
                QUALITY_STEPS.findIndex((step) => step.label === left.value) -
                QUALITY_STEPS.findIndex((step) => step.label === right.value),
            ),
        },
        {
          kind: 'range',
          values: countsOf(titles, (title) => title.files.map((file) => file.summary.videoRange)),
        },
        {
          kind: 'codec',
          values: countsOf(titles, (title) =>
            title.files.map((file) => file.summary.videoCodec.toLowerCase()),
          ),
        },
        { kind: 'genre', values: countsOf(titles, (title) => [...title.genres]) },
        { kind: 'tag', values: countsOf(titles, (title) => [...title.tags]) },
        {
          kind: 'rating',
          values: countsOf(titles, (title) =>
            title.certification === null ? [] : [title.certification],
          ),
        },
      ],
    };
  };

  /**
   * Counts the titles in each library of films and programmes that need a look: unmatched, with no
   * poster where a film, there twice, or unreadable.
   *
   * @returns The count for each library that has any.
   */
  const problems = async (): Promise<LibraryProblems> => {
    const counts = new Map<string, number>();

    for (const title of await listed(undefined)) {
      if (title.needsALook || title.isTwice || title.isUnreadable) {
        counts.set(title.row.libraryId, (counts.get(title.row.libraryId) ?? 0) + 1);
      }
    }

    return {
      libraries: [...counts.entries()].map(([libraryId, titles]) => ({ libraryId, titles })),
    };
  };

  /**
   * Reads every file of a title, with where each is: a film's versions, or a programme's episodes,
   * found by one file of it or by the programme's own row id in the list.
   *
   * @param id - One file of the title, or the list's id for a programme.
   * @returns The files and their paths, or nothing where there is no such title.
   */
  const filesOf = async (id: string): Promise<TitleFiles | null> => {
    const seriesOf = SERIES_ID.exec(id);
    const [file] =
      seriesOf === null
        ? await db
            .select({
              id: mediaItem.id,
              libraryId: mediaItem.libraryId,
              parentId: mediaItem.parentId,
              seriesId: mediaItem.seriesId,
              seriesTitle: mediaItem.seriesTitle,
            })
            .from(mediaItem)
            .where(eq(mediaItem.id, id))
            .limit(1)
        : [
            {
              id,
              libraryId: seriesOf[1] ?? '',
              parentId: null,
              seriesId: seriesOf[2] ?? null,
              seriesTitle: seriesOf[2] ?? null,
            },
          ];

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
        path: mediaItem.path,
      })
      .from(mediaItem)
      .where(
        and(
          eq(mediaItem.libraryId, file.libraryId),
          isNull(mediaItem.extraKind),
          isStillThere(),
          file.seriesTitle === null
            ? or(eq(mediaItem.id, root), eq(mediaItem.parentId, root))
            : seriesOf === null
              ? file.seriesId === null
                ? eq(mediaItem.seriesTitle, file.seriesTitle)
                : eq(mediaItem.seriesId, file.seriesId)
              : or(
                  eq(mediaItem.seriesId, file.seriesTitle),
                  eq(mediaItem.seriesTitle, file.seriesTitle),
                ),
        ),
      );

    if (rows.length === 0) {
      return null;
    }

    const files: MediaSummary[] = rows.map(({ path: _path, ...row }) =>
      summaryOfRow(row, artworkAddressOf),
    );

    return { files, paths: Object.fromEntries(rows.map((row) => [row.id, row.path])) };
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

  /**
   * Names every title of a library by the key its edits are kept under.
   *
   * @param libraryId - The library.
   * @returns Each title's key, row id, name, lead file and kind.
   */
  const subjects = async (libraryId: string) =>
    (await listed(libraryId)).flatMap((title) =>
      title.subjectKey === null
        ? []
        : [
            {
              key: title.subjectKey,
              id: title.row.id,
              name: title.row.name,
              leadId: title.row.lead.id,
              kind: title.row.kind,
            },
          ],
    );

  return { list, keys, choices, problems, filesOf, values, subjects };
};

type TitleListService = ReturnType<typeof createTitleListService>;

export type { TitleListService };

export { createTitleListService };
