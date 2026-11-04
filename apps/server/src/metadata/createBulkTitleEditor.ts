import { randomUUID } from 'node:crypto';
import { and, inArray, isNull } from 'drizzle-orm';
import { mediaItem } from '#dialect/Schema';
import { isSameTitleValue } from '@ValenceCore/functions/isSameTitleValue';
import { isStillThere } from '@ValenceServer/visibility/isStillThere';
import { LIST_FIELDS } from '@ValenceContracts/schemas/BulkTitleEdit';
import { TitleFieldSchema } from '@ValenceContracts/schemas/TitleEdit';
import { z } from 'zod';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type {
  BulkFieldState,
  BulkTarget,
  BulkTitleChange,
  BulkTitleEditRequest,
  BulkTitleFields,
  BulkTitleReadRequest,
  BulkTitleUndoRequest,
} from '@ValenceContracts/schemas/BulkTitleEdit';
import type {
  TitleEditRequest,
  TitleField,
  TitleMetadata,
  TitleValue,
} from '@ValenceContracts/schemas/TitleEdit';
import type { Actor } from './createTitleEditStore';

type MetadataOutcome = { changeSetId: string | null; metadata: TitleMetadata } | string;

type BulkEditorOptions = {
  db: AnyValenceDatabase;
  read: (mediaId: string, scope: BulkTarget['scope']) => Promise<TitleMetadata | string>;
  edit: (
    mediaId: string,
    scope: BulkTarget['scope'],
    request: TitleEditRequest,
    actor: Actor,
    sharedSetId?: string,
  ) => Promise<MetadataOutcome>;
  undo: (
    mediaId: string,
    scope: BulkTarget['scope'],
    changeSetId: string,
    actor: Actor,
    sharedSetId?: string,
    isTrying?: boolean,
  ) => Promise<MetadataOutcome>;
};

const LEADING_ARTICLE = /^(?:the|a|an)\s+(?=\S)/iu;

const WordsSchema = z.array(z.string()).catch([]);

const CertificationsSchema = z.record(z.string(), z.string()).catch({});

/**
 * What a field holds once emptied: no words for a list, no ratings for the content ratings, and
 * nothing for the rest.
 *
 * @param field - The field.
 * @returns The empty value.
 */
const emptyOf = (field: TitleField): TitleValue =>
  LIST_FIELDS.some((one) => one === field) ? [] : field === 'certifications' ? {} : null;

/**
 * Works out the edit a change made to many titles comes to for one of them, from what it holds
 * now: words added to or taken from its lists, fields emptied, its sort title filled from its title,
 * and fields set, locked or put back, each only where the title has the field.
 *
 * @param metadata - The title as it stands.
 * @param change - The change asked of every title.
 * @returns The edit, or nothing where the change asks nothing of this title.
 */
const editOf = (metadata: TitleMetadata, change: BulkTitleChange): TitleEditRequest | null => {
  const has = (field: string): field is TitleField => Object.hasOwn(metadata.fields, field);
  const set: Partial<Record<TitleField, TitleValue>> = {};

  for (const [field, value] of Object.entries(change.set ?? {})) {
    if (has(field)) {
      set[field] = value;
    }
  }

  for (const field of change.clear ?? []) {
    if (has(field) && field !== 'title') {
      set[field] = emptyOf(field);
    }
  }

  for (const field of LIST_FIELDS) {
    const adding = change.add?.[field] ?? [];
    const taking = (change.remove?.[field] ?? []).map((word) => word.toLocaleLowerCase());

    if (!has(field) || (adding.length === 0 && taking.length === 0)) {
      continue;
    }

    const current = WordsSchema.parse(set[field] ?? metadata.fields[field]?.value ?? []);
    const kept = current.filter((word) => !taking.includes(word.toLocaleLowerCase()));
    const next = [
      ...kept,
      ...adding.filter(
        (word, at) =>
          !kept.some((one) => one.toLocaleLowerCase() === word.toLocaleLowerCase()) &&
          adding.findIndex((other) => other.toLocaleLowerCase() === word.toLocaleLowerCase()) ===
            at,
      ),
    ];

    if (!isSameTitleValue(next, current)) {
      set[field] = next;
    }
  }

  const rating = change.contentRating;

  if (rating !== undefined && has('certifications')) {
    const current = CertificationsSchema.parse(metadata.fields.certifications?.value ?? {});
    const next: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(current).filter(([country]) => country !== rating.region),
      ),
      ...(rating.rating === null ? {} : { [rating.region]: rating.rating }),
    };

    if (!isSameTitleValue(next, current)) {
      set.certifications = next;
    }
  }

  const title = metadata.fields.title?.value;

  if (change.sortTitleFromTitle === true && has('sortTitle') && typeof title === 'string') {
    set.sortTitle = title.replace(LEADING_ARTICLE, '');
  }

  const fields = Object.keys(metadata.fields).filter(has);
  const lock = change.lockAll === true ? fields : (change.lock ?? []).filter(has);
  const reset = [
    ...(change.reset ?? []).filter(has),
    ...(change.unlockAll === true
      ? fields.filter((field) => metadata.fields[field]?.source === 'locked')
      : []),
  ];
  const request: TitleEditRequest = {
    ...(Object.keys(set).length === 0 ? {} : { set }),
    ...(lock.length === 0 ? {} : { lock }),
    ...(reset.length === 0 ? {} : { reset }),
  };

  return Object.keys(request).length === 0 ? null : request;
};

/**
 * Edits the metadata of many titles at once as one change, and undoes it in one step: reads how a
 * selection's fields stand together, saying where they differ, works the change out for each title
 * from what it holds, and keeps every title's part of it under one change set.
 *
 * @param options - The database, and how to read, edit and undo one title.
 * @returns The editor.
 */
const createBulkTitleEditor = ({ db, read, edit, undo }: BulkEditorOptions) => {
  /**
   * The titles a change is made to: those chosen, or every episode of the programmes chosen.
   *
   * @param targets - The titles chosen.
   * @param appliesTo - Whether the change is to them or to their episodes.
   * @returns The titles to change.
   */
  const titlesOf = async (
    targets: readonly BulkTarget[],
    appliesTo: BulkTitleEditRequest['appliesTo'],
  ): Promise<BulkTarget[]> => {
    if (appliesTo === 'titles') {
      return [...new Map(targets.map((one) => [`${one.mediaId} ${one.scope}`, one])).values()];
    }

    const chosen = await db
      .select({ seriesId: mediaItem.seriesId })
      .from(mediaItem)
      .where(
        inArray(
          mediaItem.id,
          targets.map((one) => one.mediaId),
        ),
      );
    const seriesIds = [
      ...new Set(chosen.flatMap((one) => (one.seriesId === null ? [] : [one.seriesId]))),
    ];

    if (seriesIds.length === 0) {
      return [];
    }

    const episodes = await db
      .select({ id: mediaItem.id })
      .from(mediaItem)
      .where(
        and(
          inArray(mediaItem.seriesId, seriesIds),
          isNull(mediaItem.extraKind),
          isNull(mediaItem.parentId),
          isStillThere(),
        ),
      );

    return episodes.map((one) => ({ mediaId: one.id, scope: 'episode' }));
  };

  /**
   * Reads how a selection's fields stand together: each field's value where every title agrees,
   * and that they differ where they do not.
   *
   * @param request - The titles, and whether it is their episodes being read.
   * @returns How many titles, and each field's shared state.
   */
  const readMany = async (request: BulkTitleReadRequest): Promise<BulkTitleFields> => {
    const targets = await titlesOf(request.targets, request.appliesTo);
    const seen = new Set<string>();
    const fields = new Map<TitleField, BulkFieldState>();
    let region: string | undefined;

    for (const target of targets) {
      const metadata = await read(target.mediaId, target.scope);

      if (typeof metadata === 'string' || seen.has(metadata.subject.key)) {
        continue;
      }

      seen.add(metadata.subject.key);
      region ??= metadata.certificationRegion;

      for (const [name, state] of Object.entries(metadata.fields)) {
        const field = TitleFieldSchema.safeParse(name);

        if (!field.success) {
          continue;
        }

        const held = fields.get(field.data);
        const isMixed =
          held !== undefined && (held.isMixed || !isSameTitleValue(held.value, state.value));

        fields.set(field.data, {
          value: isMixed ? null : state.value,
          isMixed,
          titles: (held?.titles ?? 0) + 1,
        });
      }
    }

    return {
      titles: seen.size,
      fields: Object.fromEntries(fields),
      ...(region === undefined ? {} : { region }),
    };
  };

  /**
   * Makes one change to many titles, each as its part of one change set.
   *
   * @param request - The titles, whether to them or their episodes, the change, and the change set
   *   to add to where this is one part of a larger selection.
   * @param actor - Who is making it.
   * @returns The change set, the titles it changed, and how many it left alone or refused, with
   *   the key of each title changed.
   */
  const editMany = async (request: BulkTitleEditRequest, actor: Actor) => {
    const changeSetId = request.changeSetId ?? randomUUID();
    const targets = await titlesOf(request.targets, request.appliesTo);
    const seen = new Set<string>();
    const changed: BulkTarget[] = [];
    const subjects: string[] = [];
    let unchanged = 0;
    let refused = 0;

    for (const target of targets) {
      const metadata = await read(target.mediaId, target.scope);

      if (typeof metadata === 'string') {
        refused += 1;
        continue;
      }

      if (seen.has(metadata.subject.key)) {
        continue;
      }

      seen.add(metadata.subject.key);

      const asked = editOf(metadata, request.change);

      if (asked === null) {
        unchanged += 1;
        continue;
      }

      const outcome = await edit(target.mediaId, target.scope, asked, actor, changeSetId);

      if (typeof outcome === 'string') {
        refused += 1;
      } else if (outcome.changeSetId === null) {
        unchanged += 1;
      } else {
        changed.push(target);
        subjects.push(metadata.subject.key);
      }
    }

    return { changeSetId, changed, unchanged, refused, subjects };
  };

  /**
   * Undoes a change made to many titles, every title's part of it or none, as one change set of its
   * own.
   *
   * @param request - The change set, the titles it changed, and the change set to add the undoing
   *   to where this is one part of a larger selection.
   * @param actor - Who is undoing it.
   * @returns The undoing's change set and how many titles it put back, or that some title was
   *   changed again since.
   */
  const undoMany = async (
    request: BulkTitleUndoRequest,
    actor: Actor,
  ): Promise<{ changeSetId: string; undone: number } | 'changedSince'> => {
    for (const target of request.targets) {
      const tried = await undo(
        target.mediaId,
        target.scope,
        request.changeSetId,
        actor,
        undefined,
        true,
      );

      if (tried === 'changedSince') {
        return 'changedSince';
      }
    }

    const undoSetId = request.undoSetId ?? randomUUID();
    let undone = 0;

    for (const target of request.targets) {
      const outcome = await undo(
        target.mediaId,
        target.scope,
        request.changeSetId,
        actor,
        undoSetId,
      );

      if (typeof outcome !== 'string' && outcome.changeSetId !== null) {
        undone += 1;
      }
    }

    return { changeSetId: undoSetId, undone };
  };

  return { readMany, editMany, undoMany };
};

type BulkTitleEditor = ReturnType<typeof createBulkTitleEditor>;

export type { BulkTitleEditor };

export { createBulkTitleEditor };
