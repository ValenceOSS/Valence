import { isSameTitleValue } from '@ValenceCore/functions/isSameTitleValue';
import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { titleChange, titleEdit } from '#dialect/Schema';
import { upsert } from '@ValenceDatabase/upsert';
import { TitleFieldSchema, TitleValueSchema } from '@ValenceContracts/schemas/TitleEdit';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type {
  TitleChange,
  TitleField,
  TitleSubjectKind,
  TitleValue,
} from '@ValenceContracts/schemas/TitleEdit';
import { z } from 'zod';

const ADMIN = 'admin';

const HISTORY_SHOWN = 200;

const StateSchema = z.object({ isEdited: z.boolean(), value: TitleValueSchema });

const ActionSchema = z.enum(['set', 'reset', 'lock', 'undo', 'rematch']);

const SubjectKindSchema = z.enum(['film', 'show', 'season', 'episode']);

type StoredTitleEdit = {
  subjectKey: string;
  subjectKind: TitleSubjectKind;
  field: TitleField;
  value: TitleValue;
  catalogue: TitleValue;
  catalogueChangedAt: Date | null;
  setAt: Date;
  setBy: string | null;
};

type FieldChange = {
  field: TitleField;
  edit: { value: TitleValue; catalogue: TitleValue } | null;
};

type Actor = { id: string | null; name: string | null };

type Subject = { libraryId: string; key: string; kind: TitleSubjectKind };

type UndoPlan =
  | {
      kind: 'undoable';
      subject: Subject;
      restore: { field: TitleField; isEdited: boolean; value: TitleValue }[];
    }
  | { kind: 'changedSince' }
  | { kind: 'missing' };

const StoredValueSchema = TitleValueSchema.catch(null);

const StoredStateSchema = StateSchema.catch({ isEdited: false, value: null });

/**
 * Keeps an administrator's edits to a title's metadata, field by field, apart from what a scan
 * writes, with every change kept as a change set so it can be shown and undone. An edit is kept
 * with the catalogue's value under it, which a scan keeps up to date, so the title page can say
 * what the catalogue says and put it back.
 *
 * @param db - The database.
 * @param now - The clock.
 * @returns The store.
 */
const createTitleEditStore = (db: AnyValenceDatabase, now: () => Date = () => new Date()) => {
  /**
   * Reads the edits kept for some titles of a library.
   *
   * @param libraryId - The library.
   * @param keys - The titles' keys.
   * @returns Their edits.
   */
  const editsFor = async (
    libraryId: string,
    keys: readonly string[],
  ): Promise<StoredTitleEdit[]> => {
    if (keys.length === 0) {
      return [];
    }

    const rows = await db
      .select({
        subjectKey: titleEdit.subjectKey,
        subjectKind: titleEdit.subjectKind,
        field: titleEdit.field,
        value: titleEdit.value,
        providerValue: titleEdit.providerValue,
        providerChangedAt: titleEdit.providerChangedAt,
        setAt: titleEdit.setAt,
        setBy: titleEdit.setBy,
      })
      .from(titleEdit)
      .where(
        and(
          eq(titleEdit.libraryId, libraryId),
          inArray(titleEdit.subjectKey, [...new Set(keys)]),
          eq(titleEdit.source, ADMIN),
        ),
      )
      .orderBy(asc(titleEdit.subjectKey), asc(titleEdit.field));

    return rows.flatMap((row) => {
      const field = TitleFieldSchema.safeParse(row.field);
      const kind = SubjectKindSchema.safeParse(row.subjectKind);

      return field.success && kind.success
        ? [
            {
              subjectKey: row.subjectKey,
              subjectKind: kind.data,
              field: field.data,
              value: StoredValueSchema.parse(row.value),
              catalogue: StoredValueSchema.parse(row.providerValue),
              catalogueChangedAt: row.providerChangedAt,
              setAt: row.setAt,
              setBy: row.setBy,
            },
          ]
        : [];
    });
  };

  /**
   * Keeps up to date what the catalogue says under each edited field, so an edit can show it and
   * be put back to it, noting when it changed.
   *
   * @param libraryId - The library.
   * @param said - What the catalogue says, by title and field.
   */
  const noteCatalogue = async (
    libraryId: string,
    said: readonly { subjectKey: string; field: TitleField; value: TitleValue }[],
  ): Promise<void> => {
    if (said.length === 0) {
      return;
    }

    const held = await editsFor(
      libraryId,
      said.map((one) => one.subjectKey),
    );

    for (const one of said) {
      const edit = held.find(
        (candidate) => candidate.subjectKey === one.subjectKey && candidate.field === one.field,
      );

      if (edit === undefined || isSameTitleValue(edit.catalogue, one.value)) {
        continue;
      }

      await db
        .update(titleEdit)
        .set({ providerValue: one.value, providerChangedAt: now() })
        .where(
          and(
            eq(titleEdit.libraryId, libraryId),
            eq(titleEdit.subjectKey, one.subjectKey),
            eq(titleEdit.field, one.field),
            eq(titleEdit.source, ADMIN),
          ),
        );
    }
  };

  /**
   * Makes or removes edits on one title, keeping the whole of it as one change set.
   *
   * @param subject - The title.
   * @param changes - For each field, the edit to keep with the catalogue's value under it, or
   *   nothing to put the field back to the catalogue's.
   * @param actor - Who made the change.
   * @param action - What kind of change it was.
   * @returns The change set's id, or nothing where nothing changed.
   */
  const change = async (
    subject: Subject,
    changes: readonly FieldChange[],
    actor: Actor,
    action: z.infer<typeof ActionSchema>,
  ): Promise<string | null> => {
    const held = await editsFor(subject.libraryId, [subject.key]);
    const changeSetId = randomUUID();
    const at = now();
    const kept = changes.flatMap((one) => {
      const before = held.find((edit) => edit.field === one.field);
      const beforeState = { isEdited: before !== undefined, value: before?.value ?? null };
      const afterState = { isEdited: one.edit !== null, value: one.edit?.value ?? null };

      return beforeState.isEdited === afterState.isEdited &&
        isSameTitleValue(beforeState.value, afterState.value)
        ? []
        : [{ ...one, beforeState, afterState }];
    });

    if (kept.length === 0) {
      return null;
    }

    await db.transaction(async (tx) => {
      for (const one of kept) {
        if (one.edit === null) {
          await tx
            .delete(titleEdit)
            .where(
              and(
                eq(titleEdit.libraryId, subject.libraryId),
                eq(titleEdit.subjectKey, subject.key),
                eq(titleEdit.field, one.field),
                eq(titleEdit.source, ADMIN),
              ),
            );
        } else {
          const values = {
            subjectKind: subject.kind,
            value: one.edit.value,
            providerValue: one.edit.catalogue,
            setAt: at,
            setBy: actor.id,
          };

          await upsert(tx, titleEdit, {
            values: [
              {
                id: randomUUID(),
                libraryId: subject.libraryId,
                subjectKey: subject.key,
                field: one.field,
                source: ADMIN,
                ...values,
              },
            ],
            target: [titleEdit.libraryId, titleEdit.subjectKey, titleEdit.field, titleEdit.source],
            set: values,
          });
        }

        await tx.insert(titleChange).values({
          id: randomUUID(),
          changeSetId,
          libraryId: subject.libraryId,
          subjectKey: subject.key,
          subjectKind: subject.kind,
          field: one.field,
          before: one.beforeState,
          after: one.afterState,
          action,
          at,
          actorId: actor.id,
          actorName: actor.name,
        });
      }
    });

    return changeSetId;
  };

  /**
   * Reads a title's changes, newest first, each change set as one.
   *
   * @param libraryId - The library.
   * @param subjectKey - The title.
   * @returns Its changes.
   */
  const history = async (libraryId: string, subjectKey: string): Promise<TitleChange[]> => {
    const rows = await db
      .select()
      .from(titleChange)
      .where(and(eq(titleChange.libraryId, libraryId), eq(titleChange.subjectKey, subjectKey)))
      .orderBy(desc(titleChange.at), asc(titleChange.changeSetId), asc(titleChange.field))
      .limit(HISTORY_SHOWN);
    const sets = new Map<string, TitleChange>();

    for (const row of rows) {
      const field = TitleFieldSchema.safeParse(row.field);
      const action = ActionSchema.safeParse(row.action);

      if (!field.success || !action.success) {
        continue;
      }

      const before = StoredStateSchema.parse(row.before);
      const after = StoredStateSchema.parse(row.after);
      const held = sets.get(row.changeSetId) ?? {
        changeSetId: row.changeSetId,
        at: row.at.toISOString(),
        by: row.actorName,
        action: action.data,
        fields: [],
      };

      sets.set(row.changeSetId, {
        ...held,
        fields: [...held.fields, { field: field.data, before: before.value, after: after.value }],
      });
    }

    return [...sets.values()];
  };

  /**
   * Works out what undoing a change set would put back, refusing where any field it changed has
   * been changed again since.
   *
   * @param changeSetId - The change set.
   * @returns The title and each field's state before the change, or why it cannot be undone.
   */
  const planUndo = async (changeSetId: string): Promise<UndoPlan> => {
    const rows = await db
      .select()
      .from(titleChange)
      .where(eq(titleChange.changeSetId, changeSetId));
    const [first] = rows;
    const kind = SubjectKindSchema.safeParse(first?.subjectKind);

    if (first === undefined || !kind.success) {
      return { kind: 'missing' };
    }

    const subject = { libraryId: first.libraryId, key: first.subjectKey, kind: kind.data };
    const held = await editsFor(subject.libraryId, [subject.key]);
    const restore: { field: TitleField; isEdited: boolean; value: TitleValue }[] = [];

    for (const row of rows) {
      const field = TitleFieldSchema.safeParse(row.field);

      if (!field.success) {
        continue;
      }

      const before = StoredStateSchema.parse(row.before);
      const after = StoredStateSchema.parse(row.after);
      const standing = held.find((edit) => edit.field === field.data);

      if (
        (standing !== undefined) !== after.isEdited ||
        !isSameTitleValue(standing?.value ?? null, after.value)
      ) {
        return { kind: 'changedSince' };
      }

      restore.push({ field: field.data, isEdited: before.isEdited, value: before.value });
    }

    return { kind: 'undoable', subject, restore };
  };

  return { editsFor, noteCatalogue, change, history, planUndo };
};

type TitleEditStore = ReturnType<typeof createTitleEditStore>;

export type { StoredTitleEdit, FieldChange, TitleEditStore, Subject, Actor, UndoPlan };

export { createTitleEditStore };
