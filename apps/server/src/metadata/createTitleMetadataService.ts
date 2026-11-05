import { isSameTitleValue } from '@ValenceCore/functions/isSameTitleValue';
import { and, eq, inArray, isNull, isNotNull, or } from 'drizzle-orm';
import { mediaItem, series } from '#dialect/Schema';
import { certificationAgeOf } from '@ValenceServer/library/certificationAgeOf';
import { readStoredCertifications } from '@ValenceServer/library/readStoredCertifications';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import {
  CastEntrySchema,
  FIELDS_OF_KIND,
  TITLE_FIELD_SCHEMAS,
  TitleFieldSchema,
} from '@ValenceContracts/schemas/TitleEdit';
import { columnOfField } from './columnOfField';
import { addedAtOfDay } from './addedAtOfDay';
import { subjectKeysOf } from './subjectKeysOf';
import { valuesOfCandidate } from './valuesOfCandidate';
import { retryingDeadlocks } from './retryingDeadlocks';
import { z } from 'zod';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { CatalogueDescription, SeriesShape } from '@ValenceServer/library/MetadataProvider';
import type {
  MatchPreview,
  TitleEditRequest,
  TitleField,
  TitleFieldState,
  TitleHistory,
  TitleMetadata,
  TitleSubjectKind,
  TitleValue,
} from '@ValenceContracts/schemas/TitleEdit';
import type { Actor, FieldChange, Subject, TitleEditStore } from './createTitleEditStore';
import type { EditableColumns, EditScope } from './EditableColumns';

type TitleScope = 'title' | 'season' | 'episode';

type Refusal = 'missing' | 'notThisKind' | 'invalid' | 'changedSince' | 'notInCatalogue';

type MatchCandidate = { externalId: string; kind: 'tv' | 'movie' };

type MetadataServiceOptions = {
  db: AnyValenceDatabase;
  edits: TitleEditStore;
  certificationRegion: () => Promise<string>;
  seriesShape: (externalId: string) => Promise<SeriesShape | null>;
  describeCandidate?: (
    externalId: string,
    kind: 'tv' | 'movie',
  ) => Promise<CatalogueDescription | null>;
  forgetCatalogue?: (externalId: string, kind: 'tv' | 'movie') => void;
  onChanged?: (mediaIds: string[]) => void;
};

const WordsSchema = z.array(z.string()).nullable().catch(null);

const NumberSchema = z.number().nullable().catch(null);

const CastSchema = z.array(CastEntrySchema).nullable().catch(null);

const SHOW_FROM_SHAPE: readonly TitleField[] = ['overview', 'status', 'releaseDate'];

const ROW = {
  id: mediaItem.id,
  libraryId: mediaItem.libraryId,
  path: mediaItem.path,
  externalId: mediaItem.externalId,
  seriesId: mediaItem.seriesId,
  seriesKey: series.key,
  seasonNumber: mediaItem.seasonNumber,
  episodeNumber: mediaItem.episodeNumber,
  catalogueEpisodeId: mediaItem.catalogueEpisodeId,
  extraKind: mediaItem.extraKind,
  title: mediaItem.title,
  sortTitle: mediaItem.sortTitle,
  originalTitle: mediaItem.originalTitle,
  year: mediaItem.year,
  tagline: mediaItem.tagline,
  overview: mediaItem.overview,
  releaseDate: mediaItem.releaseDate,
  addedAt: mediaItem.addedAt,
  genres: mediaItem.genres,
  tags: mediaItem.tags,
  studios: mediaItem.studios,
  networks: mediaItem.networks,
  certifications: mediaItem.certifications,
  rating: mediaItem.rating,
  rottenTomatoes: mediaItem.rottenTomatoes,
  imdbId: mediaItem.imdbId,
  tvdbId: mediaItem.tvdbId,
  anilistId: series.anilistId,
  malId: series.malId,
  castMembers: mediaItem.castMembers,
  trailerKey: mediaItem.trailerKey,
  seriesTitle: mediaItem.seriesTitle,
  seriesSortTitle: mediaItem.seriesSortTitle,
};

/**
 * Edits the metadata of a film, a programme, a season or an episode on an administrator's word:
 * reads each field with where its value came from, keeps an edit for each change, and writes the
 * result straight onto every file of the title, so every list, search and app sees it at once
 * without waiting for a scan.
 *
 * @param options - The database, the kept edits, whose age certificates to read, how to read a
 *   programme's shape and another entry's description from the catalogue, how to make it forget
 *   what it said of one, and who to tell when files change.
 * @returns The service.
 */
const createTitleMetadataService = ({
  db,
  edits,
  certificationRegion,
  seriesShape,
  describeCandidate,
  forgetCatalogue,
  onChanged,
}: MetadataServiceOptions) => {
  /**
   * Reads a file and the programme key it belongs to.
   *
   * @param mediaId - The file.
   * @returns The file, or nothing.
   */
  const fileOf = async (mediaId: string) => {
    const [row] = await db
      .select(ROW)
      .from(mediaItem)
      .leftJoin(series, eq(series.id, mediaItem.seriesId))
      .where(eq(mediaItem.id, mediaId))
      .limit(1);

    return row ?? null;
  };

  type File = NonNullable<Awaited<ReturnType<typeof fileOf>>>;

  /**
   * Reads a file's columns as the ones an edit can reach.
   *
   * @param file - The file.
   * @returns Its editable columns.
   */
  const columnsOf = (file: File): EditableColumns => ({
    title: file.title,
    sortTitle: file.sortTitle,
    originalTitle: file.originalTitle,
    year: file.year,
    tagline: file.tagline,
    overview: file.overview,
    releaseDate: file.releaseDate,
    addedAt: file.addedAt.toISOString().slice(0, 10),
    genres: WordsSchema.parse(file.genres),
    tags: WordsSchema.parse(file.tags),
    studios: WordsSchema.parse(file.studios),
    networks: WordsSchema.parse(file.networks),
    certifications: readStoredCertifications(JsonValueSchema.parse(file.certifications ?? null)),
    rating: NumberSchema.parse(file.rating),
    rottenTomatoes: NumberSchema.parse(file.rottenTomatoes),
    imdbId: file.imdbId,
    tvdbId: file.tvdbId,
    anilistId: file.anilistId?.toString() ?? null,
    malId: file.malId?.toString() ?? null,
    castMembers: CastSchema.parse(file.castMembers ?? null),
    trailerKey: file.trailerKey,
    seriesTitle: file.seriesTitle,
    seriesSortTitle: file.seriesSortTitle,
  });

  /**
   * Works out which title a file is asked about as, and its key.
   *
   * @param file - The file.
   * @param scope - The film or programme itself, the file's season, or the file's episode.
   * @returns The title, or nothing where the file is not that kind of thing.
   */
  const subjectOf = (file: File, scope: TitleScope): (Subject & { scope: EditScope }) | null => {
    const keys = subjectKeysOf({
      path: file.path,
      externalId: file.externalId,
      seriesKey: file.seriesTitle === null ? null : (file.seriesKey ?? `title:${file.seriesTitle}`),
      seasonNumber: file.seasonNumber,
      episodeNumber: file.episodeNumber,
      catalogueEpisodeId: file.catalogueEpisodeId,
      extraKind: file.extraKind,
    });

    if (keys.kind === 'film') {
      return scope === 'title'
        ? { libraryId: file.libraryId, key: keys.film, kind: 'film', scope: 'film' }
        : null;
    }

    if (keys.kind === 'none') {
      return null;
    }

    if (scope === 'title') {
      return { libraryId: file.libraryId, key: keys.show, kind: 'show', scope: 'show' };
    }

    if (scope === 'season') {
      return keys.season === null
        ? null
        : { libraryId: file.libraryId, key: keys.season, kind: 'season', scope: 'show' };
    }

    return keys.episode === null
      ? null
      : { libraryId: file.libraryId, key: keys.episode, kind: 'episode', scope: 'episode' };
  };

  /**
   * Finds every file a title's edits reach.
   *
   * @param file - One file of the title.
   * @param kind - Which kind of title.
   * @returns The files' ids.
   */
  const filesOfSubject = async (file: File, kind: TitleSubjectKind): Promise<string[]> => {
    const where =
      kind === 'film'
        ? file.externalId === null
          ? or(eq(mediaItem.id, file.id), eq(mediaItem.parentId, file.id))
          : and(
              eq(mediaItem.externalId, file.externalId),
              isNull(mediaItem.seriesTitle),
              isNull(mediaItem.extraKind),
            )
        : kind === 'show'
          ? file.seriesId === null
            ? eq(mediaItem.id, file.id)
            : and(eq(mediaItem.seriesId, file.seriesId), isNotNull(mediaItem.seriesTitle))
          : file.seriesId === null || file.seasonNumber === null || file.episodeNumber === null
            ? eq(mediaItem.id, file.id)
            : and(
                eq(mediaItem.seriesId, file.seriesId),
                eq(mediaItem.seasonNumber, file.seasonNumber),
                eq(mediaItem.episodeNumber, file.episodeNumber),
                isNull(mediaItem.extraKind),
              );
    const rows = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(and(eq(mediaItem.libraryId, file.libraryId), where));

    return rows.map((row) => row.id);
  };

  /**
   * Reads what the catalogue's live record of a programme says of the fields it is not stored for.
   *
   * @param file - One file of the programme.
   * @param seasonNumber - The season asked about, or nothing for the programme itself.
   * @returns The values, by field.
   */
  const shapeValues = async (
    file: File,
    seasonNumber: number | null,
  ): Promise<Partial<Record<TitleField, TitleValue>>> => {
    const shape =
      file.externalId === null ? null : await seriesShape(file.externalId).catch(() => null);

    if (seasonNumber !== null) {
      const season = shape?.seasons.find((one) => one.seasonNumber === seasonNumber);
      const aired =
        season?.airDate ??
        season?.episodes.find((one) => (one.airDate ?? null) !== null)?.airDate ??
        null;

      return {
        title: season?.name ?? null,
        overview: season?.overview ?? null,
        releaseDate: aired,
      };
    }

    const firstAired =
      shape?.seasons
        .flatMap((one) => one.episodes)
        .map((one) => one.airDate ?? null)
        .filter((day): day is string => day !== null)
        .sort()[0] ?? null;

    return {
      overview: shape?.overview ?? null,
      status: shape?.status ?? null,
      releaseDate: firstAired,
    };
  };

  /**
   * Reads every field of a title, each with where its value came from and what the catalogue says.
   *
   * @param file - One file of the title.
   * @param subject - The title.
   * @returns The title's metadata.
   */
  const describe = async (
    file: File,
    subject: Subject & { scope: EditScope },
  ): Promise<TitleMetadata> => {
    const kept = await edits.editsFor(subject.libraryId, [subject.key]);
    const columns = columnsOf(file);
    const live =
      subject.kind === 'season'
        ? await shapeValues(file, file.seasonNumber)
        : subject.kind === 'show'
          ? await shapeValues(file, null)
          : {};
    const isMatched = file.externalId !== null && file.externalId !== '';
    const fields: Partial<Record<TitleField, TitleFieldState>> = {};

    for (const field of FIELDS_OF_KIND[subject.kind]) {
      const edit = kept.find((one) => one.field === field);
      const column = subject.kind === 'season' ? undefined : columnOfField(subject.scope, field);
      const fromLive = subject.kind === 'season' || SHOW_FROM_SHAPE.includes(field);
      const standing =
        field === 'note'
          ? null
          : fromLive && subject.kind !== 'film' && subject.kind !== 'episode'
            ? (live[field] ?? null)
            : column === undefined
              ? null
              : columns[column];
      const catalogue = edit === undefined ? standing : edit.catalogue;

      fields[field] = {
        value: edit === undefined ? standing : edit.value,
        source:
          edit === undefined
            ? isMatched
              ? 'catalogue'
              : 'file'
            : isSameTitleValue(edit.value, edit.catalogue)
              ? 'locked'
              : 'edited',
        catalogue,
        catalogueChangedAt: edit?.catalogueChangedAt?.toISOString() ?? null,
        setAt: edit?.setAt.toISOString() ?? null,
        setBy: edit?.setBy ?? null,
      };
    }

    return {
      subject: {
        kind: subject.kind,
        key: subject.key,
        libraryId: subject.libraryId,
        isMatched,
      },
      fields,
      certificationRegion: (await certificationRegion()).trim().toUpperCase(),
    };
  };

  /**
   * Writes a title's new values onto every file of it, so each reads as edited at once.
   *
   * @param file - One file of the title.
   * @param subject - The title.
   * @param values - The value each changed field now has.
   * @param catalogue - What the catalogue says under each, for a content rating laid over it.
   */
  const writeThrough = async (
    file: File,
    subject: Subject & { scope: EditScope },
    values: Partial<Record<TitleField, TitleValue>>,
    catalogue: Partial<Record<TitleField, TitleValue>>,
  ): Promise<void> => {
    if (subject.kind === 'season') {
      return;
    }

    const set: Record<string, TitleValue | number | Date | null> = {};
    const ofSeries: { anilistId?: number | null; malId?: number | null } = {};

    for (const [name, value] of Object.entries(values)) {
      const field = TitleFieldSchema.safeParse(name);
      const column = field.success ? columnOfField(subject.scope, field.data) : undefined;

      if (column === undefined) {
        continue;
      }

      if (column === 'certifications') {
        const under = catalogue.certifications;
        const merged = {
          ...(under !== null && typeof under === 'object' && !Array.isArray(under) ? under : {}),
          ...(value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}),
        };

        set.certifications = merged;
        set.certificationAge = certificationAgeOf(await certificationRegion(), merged);
        continue;
      }

      if (column === 'anilistId' || column === 'malId') {
        ofSeries[column] = typeof value === 'string' ? Number(value) : null;
        continue;
      }

      if (column === 'addedAt') {
        if (typeof value === 'string') {
          set.addedAt = addedAtOfDay(value);
        }

        continue;
      }

      set[column] = value;

      if (column === 'releaseDate' && subject.kind === 'film' && typeof value === 'string') {
        set.year = Number.parseInt(value.slice(0, 4), 10);
      }
    }

    if (Object.keys(ofSeries).length > 0 && file.seriesId !== null) {
      await db.update(series).set(ofSeries).where(eq(series.id, file.seriesId));
    }

    if (Object.keys(set).length === 0) {
      return;
    }

    const ids = await filesOfSubject(file, subject.kind);

    if (ids.length === 0) {
      return;
    }

    await retryingDeadlocks(() =>
      db
        .update(mediaItem)
        .set({ ...set, updatedAt: new Date() })
        .where(inArray(mediaItem.id, ids)),
    );

    if (subject.kind === 'show' && file.seriesId !== null && typeof values.title === 'string') {
      await db.update(series).set({ title: values.title }).where(eq(series.id, file.seriesId));
    }

    onChanged?.(ids);
  };

  /**
   * Reads a title's metadata through one of its files.
   *
   * @param mediaId - A file of the title.
   * @param scope - The film or programme, the file's season, or the file's episode.
   * @returns The metadata, or why there is none.
   */
  const read = async (mediaId: string, scope: TitleScope): Promise<TitleMetadata | Refusal> => {
    const file = await fileOf(mediaId);
    const subject = file === null ? null : subjectOf(file, scope);

    if (file === null) {
      return 'missing';
    }

    return subject === null ? 'notThisKind' : describe(file, subject);
  };

  /**
   * Sets, locks and puts back fields of a title as one change, and writes the result onto every
   * file of it.
   *
   * @param mediaId - A file of the title.
   * @param scope - The film or programme, the file's season, or the file's episode.
   * @param request - The fields to set, to lock as they stand, and to put back.
   * @param actor - Who is changing it.
   * @param sharedSetId - The change set to add it to, where it is one title of many changed at once.
   * @returns The change and the title as it now stands, or why nothing changed.
   */
  const edit = async (
    mediaId: string,
    scope: TitleScope,
    request: TitleEditRequest,
    actor: Actor,
    sharedSetId?: string,
  ): Promise<{ changeSetId: string | null; metadata: TitleMetadata } | Refusal> => {
    const file = await fileOf(mediaId);
    const subject = file === null ? null : subjectOf(file, scope);

    if (file === null) {
      return 'missing';
    }

    if (subject === null) {
      return 'notThisKind';
    }

    const allowed = FIELDS_OF_KIND[subject.kind];
    const asked = [
      ...Object.keys(request.set ?? {}),
      ...(request.reset ?? []),
      ...(request.lock ?? []),
    ];

    if (asked.some((field) => !allowed.some((one) => one === field))) {
      return 'invalid';
    }

    const before = await describe(file, subject);
    const changes: FieldChange[] = [];
    const values: Partial<Record<TitleField, TitleValue>> = {};
    const catalogue: Partial<Record<TitleField, TitleValue>> = {};

    for (const field of allowed) {
      const state = before.fields[field];
      const under = state?.catalogue ?? null;
      const setTo = request.set?.[field];

      catalogue[field] = under;

      if (setTo !== undefined) {
        const checked = TITLE_FIELD_SCHEMAS[field].safeParse(setTo);

        if (!checked.success) {
          return 'invalid';
        }

        changes.push({ field, edit: { value: checked.data, catalogue: under } });
        values[field] = checked.data;
      } else if (request.lock?.includes(field) === true) {
        changes.push({ field, edit: { value: state?.value ?? null, catalogue: under } });
        values[field] = state?.value ?? null;
      } else if (request.reset?.includes(field) === true) {
        changes.push({ field, edit: null });
        values[field] = under;
      }
    }

    const changeSetId = await edits.change(
      subject,
      changes,
      actor,
      request.reset !== undefined && request.set === undefined && request.lock === undefined
        ? 'reset'
        : request.lock !== undefined && request.set === undefined
          ? 'lock'
          : 'set',
      sharedSetId,
    );

    if (changeSetId !== null) {
      await writeThrough(file, subject, values, catalogue);
    }

    const fresh = await fileOf(mediaId);

    return { changeSetId, metadata: await describe(fresh ?? file, subject) };
  };

  /**
   * Reads a title's changes, newest first.
   *
   * @param mediaId - A file of the title.
   * @param scope - The film or programme, the file's season, or the file's episode.
   * @returns The changes, or why there are none.
   */
  const history = async (mediaId: string, scope: TitleScope): Promise<TitleHistory | Refusal> => {
    const file = await fileOf(mediaId);
    const subject = file === null ? null : subjectOf(file, scope);

    if (file === null) {
      return 'missing';
    }

    return subject === null
      ? 'notThisKind'
      : { changes: await edits.history(subject.libraryId, subject.key) };
  };

  /**
   * Puts back what a change set changed, as a new change of its own.
   *
   * @param mediaId - A file of the title it changed.
   * @param scope - The film or programme, the file's season, or the file's episode.
   * @param changeSetId - The change set.
   * @param actor - Who is undoing it.
   * @param sharedSetId - The change set the undoing joins, where many titles are undone at once.
   * @param isTrying - Whether only to say if it could be undone, changing nothing.
   * @returns The title as it now stands, or why it could not be undone.
   */
  const undo = async (
    mediaId: string,
    scope: TitleScope,
    changeSetId: string,
    actor: Actor,
    sharedSetId?: string,
    isTrying = false,
  ): Promise<{ changeSetId: string | null; metadata: TitleMetadata } | Refusal> => {
    const file = await fileOf(mediaId);
    const subject = file === null ? null : subjectOf(file, scope);
    const plan =
      subject === null
        ? await edits.planUndo(changeSetId)
        : await edits.planUndo(changeSetId, subject);

    if (file === null || subject === null || plan.kind === 'missing') {
      return 'missing';
    }

    if (plan.kind === 'changedSince') {
      return 'changedSince';
    }

    if (plan.subject.key !== subject.key || plan.subject.libraryId !== subject.libraryId) {
      return 'missing';
    }

    if (isTrying) {
      return { changeSetId: null, metadata: await describe(file, subject) };
    }

    const before = await describe(file, subject);
    const changes: FieldChange[] = [];
    const values: Partial<Record<TitleField, TitleValue>> = {};
    const catalogue: Partial<Record<TitleField, TitleValue>> = {};

    for (const one of plan.restore) {
      const under = before.fields[one.field]?.catalogue ?? null;

      catalogue[one.field] = under;
      changes.push({
        field: one.field,
        edit: one.isEdited ? { value: one.value, catalogue: under } : null,
      });
      values[one.field] = one.isEdited ? one.value : under;
    }

    const made = await edits.change(subject, changes, actor, 'undo', sharedSetId);

    if (made !== null) {
      await writeThrough(file, subject, values, catalogue);
    }

    const fresh = await fileOf(mediaId);

    return { changeSetId: made, metadata: await describe(fresh ?? file, subject) };
  };

  /**
   * Reads a title as it stands beside what the catalogue entry it is about to be matched to says.
   *
   * @param mediaId - A file of the title.
   * @param candidate - The entry it would be matched to.
   * @returns The title's present metadata and the entry's, or why it cannot be compared.
   */
  const lookAhead = async (mediaId: string, candidate: MatchCandidate) => {
    const file = await fileOf(mediaId);
    const subject = file === null ? null : subjectOf(file, 'title');

    if (file === null) {
      return 'missing';
    }

    if (subject === null) {
      return 'notThisKind';
    }

    const described = await (
      describeCandidate?.(candidate.externalId, candidate.kind) ?? Promise.resolve(null)
    ).catch(() => null);

    if (described === null) {
      return 'notInCatalogue';
    }

    const kind: TitleSubjectKind = candidate.kind === 'tv' ? 'show' : 'film';

    return {
      file,
      subject,
      kind,
      described,
      current: await describe(file, subject),
      next: valuesOfCandidate(described),
    };
  };

  /**
   * Compares a title, field by field, with the catalogue entry it is about to be matched to.
   *
   * @param mediaId - A file of the title.
   * @param candidate - The entry it would be matched to.
   * @returns Each field the entry fills, as it stands and as it would be, or why there is nothing.
   */
  const preview = async (
    mediaId: string,
    candidate: MatchCandidate,
  ): Promise<MatchPreview | Refusal> => {
    const ahead = await lookAhead(mediaId, candidate);

    if (typeof ahead === 'string') {
      return ahead;
    }

    return {
      kind: ahead.kind,
      rows: FIELDS_OF_KIND[ahead.kind].flatMap((field) => {
        const next = ahead.next[field];
        const current = ahead.current.fields[field];

        return next === undefined || current === undefined ? [] : [{ field, current, next }];
      }),
      posterUrl: ahead.described.posterUrl,
      backdropUrl: ahead.described.backdropUrl,
    };
  };

  /**
   * Carries what a title is to keep over to the catalogue entry it is being matched to, before the
   * match is made: the fields chosen to keep as they stand, and every edit to a field the catalogue
   * does not fill, such as a note.
   *
   * @param mediaId - A file of the title.
   * @param candidate - The entry it is being matched to.
   * @param keep - The fields to keep as they stand rather than take from the entry.
   * @param actor - Who is matching it.
   * @returns The change carried over, which is nothing where there was nothing to carry, or why
   *   it could not be.
   */
  const carry = async (
    mediaId: string,
    candidate: MatchCandidate,
    keep: readonly TitleField[],
    actor: Actor,
  ): Promise<{ changeSetId: string | null } | Refusal> => {
    const ahead = await lookAhead(mediaId, candidate);

    if (typeof ahead === 'string') {
      return ahead;
    }

    const changes = FIELDS_OF_KIND[ahead.kind].flatMap((field): FieldChange[] => {
      const state = ahead.current.fields[field];
      const next = ahead.next[field];
      const isEdited = state?.source === 'edited' || state?.source === 'locked';

      return state === undefined || !(next === undefined ? isEdited : keep.includes(field))
        ? []
        : [{ field, edit: { value: state.value, catalogue: next ?? state.catalogue ?? null } }];
    });

    return {
      changeSetId:
        changes.length === 0
          ? null
          : await edits.change(
              {
                libraryId: ahead.subject.libraryId,
                kind: ahead.kind,
                key: `${candidate.kind}:${candidate.externalId}`,
              },
              changes,
              actor,
              'rematch',
            ),
    };
  };

  /**
   * Asks the catalogue again for some fields of a title, keeping its match and every edit: a field
   * left as the catalogue had it takes the new value, and an edited one only notes what the
   * catalogue says now.
   *
   * @param mediaId - A file of the title.
   * @param fields - The fields to ask for again.
   * @returns How many fields took a new value, and the title as it now stands, or why not.
   */
  const refreshFields = async (
    mediaId: string,
    fields: readonly TitleField[],
  ): Promise<{ updated: number; metadata: TitleMetadata } | Refusal> => {
    const file = await fileOf(mediaId);
    const subject = file === null ? null : subjectOf(file, 'title');

    if (file === null) {
      return 'missing';
    }

    if (subject === null || file.externalId === null || file.externalId === '') {
      return 'notThisKind';
    }

    const matched = {
      externalId: file.externalId,
      kind: subject.kind === 'show' ? ('tv' as const) : ('movie' as const),
    };

    forgetCatalogue?.(matched.externalId, matched.kind);

    const ahead = await lookAhead(mediaId, matched);

    if (typeof ahead === 'string') {
      return ahead;
    }

    const values: Partial<Record<TitleField, TitleValue>> = {};
    const noted: { subjectKey: string; field: TitleField; value: TitleValue }[] = [];

    for (const field of FIELDS_OF_KIND[subject.kind]) {
      const next = ahead.next[field];
      const state = ahead.current.fields[field];
      const isLive = subject.kind === 'show' && SHOW_FROM_SHAPE.includes(field);

      if (!fields.includes(field) || next === undefined || state === undefined || isLive) {
        continue;
      }

      if (state.source === 'edited' || state.source === 'locked') {
        noted.push({ subjectKey: subject.key, field, value: next });
      } else if (!isSameTitleValue(state.value, next)) {
        values[field] = next;
      }
    }

    await edits.noteCatalogue(subject.libraryId, noted);
    await writeThrough(file, subject, values, values);

    const fresh = await fileOf(mediaId);

    return {
      updated: Object.keys(values).length,
      metadata: await describe(fresh ?? file, subject),
    };
  };

  /**
   * Asks the catalogue what it says now of every matched film and programme an administrator has
   * edited, and notes where that has changed under an edit, so the edit can say so and offer the
   * catalogue's new value. Nothing on the files changes.
   *
   * @param onProgress - Told how many have been asked of how many.
   * @returns How many were asked.
   */
  const noteCatalogueChanges = async (
    onProgress?: (done: number, total: number) => void,
  ): Promise<number> => {
    const titles = await edits.matchedTitles();
    let done = 0;

    for (const title of titles) {
      onProgress?.(done, titles.length);

      const isShow = title.subjectKind === 'show';
      const externalId = title.subjectKey.slice(isShow ? 'tv:'.length : 'movie:'.length);
      const described = await (
        describeCandidate?.(externalId, isShow ? 'tv' : 'movie') ?? Promise.resolve(null)
      ).catch(() => null);

      if (described !== null) {
        await edits.noteCatalogue(
          title.libraryId,
          Object.entries(valuesOfCandidate(described)).flatMap(([name, value]) => {
            const field = TitleFieldSchema.safeParse(name);

            return field.success
              ? [{ subjectKey: title.subjectKey, field: field.data, value }]
              : [];
          }),
        );
      }

      done += 1;
    }

    onProgress?.(done, titles.length);

    return done;
  };

  return { read, edit, history, undo, preview, carry, refreshFields, noteCatalogueChanges };
};

type TitleMetadataService = ReturnType<typeof createTitleMetadataService>;

export type { TitleScope, MatchCandidate, TitleMetadataService };

export { createTitleMetadataService };
