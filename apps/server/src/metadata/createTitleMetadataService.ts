import { and, eq, inArray, isNull, isNotNull, or } from 'drizzle-orm';
import { mediaItem, series } from '#dialect/Schema';
import { certificationAgeOf } from '@ValenceServer/library/certificationAgeOf';
import { readStoredCertifications } from '@ValenceServer/library/readStoredCertifications';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import {
  FIELDS_OF_KIND,
  TITLE_FIELD_SCHEMAS,
  TitleFieldSchema,
} from '@ValenceContracts/schemas/TitleEdit';
import { columnOfField } from './columnOfField';
import { subjectKeysOf } from './subjectKeysOf';
import { z } from 'zod';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { SeriesShape } from '@ValenceServer/library/MetadataProvider';
import type {
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

type Refusal = 'missing' | 'notThisKind' | 'invalid' | 'changedSince';

type MetadataServiceOptions = {
  db: AnyValenceDatabase;
  edits: TitleEditStore;
  certificationRegion: () => Promise<string>;
  seriesShape: (externalId: string) => Promise<SeriesShape | null>;
  onChanged?: (mediaIds: string[]) => void;
};

const WordsSchema = z.array(z.string()).nullable().catch(null);

const NumberSchema = z.number().nullable().catch(null);

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
  genres: mediaItem.genres,
  tags: mediaItem.tags,
  studios: mediaItem.studios,
  networks: mediaItem.networks,
  certifications: mediaItem.certifications,
  rating: mediaItem.rating,
  rottenTomatoes: mediaItem.rottenTomatoes,
  imdbId: mediaItem.imdbId,
  tvdbId: mediaItem.tvdbId,
  seriesTitle: mediaItem.seriesTitle,
  seriesSortTitle: mediaItem.seriesSortTitle,
};

/**
 * Says whether two values are the same, whatever order a map's keys came in.
 *
 * @param one - A value.
 * @param other - Another.
 * @returns Whether they say the same.
 */
const isSame = (one: TitleValue, other: TitleValue): boolean =>
  JSON.stringify(one) === JSON.stringify(other);

/**
 * Edits the metadata of a film, a programme, a season or an episode on an administrator's word:
 * reads each field with where its value came from, keeps an edit for each change, and writes the
 * result straight onto every file of the title, so every list, search and app sees it at once
 * without waiting for a scan.
 *
 * @param options - The database, the kept edits, whose age certificates to read, how to read a
 *   programme's shape from the catalogue, and who to tell when files change.
 * @returns The service.
 */
const createTitleMetadataService = ({
  db,
  edits,
  certificationRegion,
  seriesShape,
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
    genres: WordsSchema.parse(file.genres),
    tags: WordsSchema.parse(file.tags),
    studios: WordsSchema.parse(file.studios),
    networks: WordsSchema.parse(file.networks),
    certifications: readStoredCertifications(JsonValueSchema.parse(file.certifications ?? null)),
    rating: NumberSchema.parse(file.rating),
    rottenTomatoes: NumberSchema.parse(file.rottenTomatoes),
    imdbId: file.imdbId,
    tvdbId: file.tvdbId,
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
            : isSame(edit.value, edit.catalogue)
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

    const set: Record<string, TitleValue | number | null> = {};

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

      set[column] = value;

      if (column === 'releaseDate' && subject.kind === 'film' && typeof value === 'string') {
        set.year = Number.parseInt(value.slice(0, 4), 10);
      }
    }

    if (Object.keys(set).length === 0) {
      return;
    }

    const ids = await filesOfSubject(file, subject.kind);

    if (ids.length === 0) {
      return;
    }

    await db
      .update(mediaItem)
      .set({ ...set, updatedAt: new Date() })
      .where(inArray(mediaItem.id, ids));

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
   * @returns The change and the title as it now stands, or why nothing changed.
   */
  const edit = async (
    mediaId: string,
    scope: TitleScope,
    request: TitleEditRequest,
    actor: Actor,
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
   * @returns The title as it now stands, or why it could not be undone.
   */
  const undo = async (
    mediaId: string,
    scope: TitleScope,
    changeSetId: string,
    actor: Actor,
  ): Promise<{ changeSetId: string | null; metadata: TitleMetadata } | Refusal> => {
    const file = await fileOf(mediaId);
    const subject = file === null ? null : subjectOf(file, scope);
    const plan = await edits.planUndo(changeSetId);

    if (file === null || subject === null || plan.kind === 'missing') {
      return 'missing';
    }

    if (plan.kind === 'changedSince') {
      return 'changedSince';
    }

    if (plan.subject.key !== subject.key || plan.subject.libraryId !== subject.libraryId) {
      return 'missing';
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

    const made = await edits.change(subject, changes, actor, 'undo');

    if (made !== null) {
      await writeThrough(file, subject, values, catalogue);
    }

    const fresh = await fileOf(mediaId);

    return { changeSetId: made, metadata: await describe(fresh ?? file, subject) };
  };

  return { read, edit, history, undo };
};

type TitleMetadataService = ReturnType<typeof createTitleMetadataService>;

export type { TitleScope, TitleMetadataService };

export { createTitleMetadataService };
