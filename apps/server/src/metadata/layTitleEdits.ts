import { overlayTitleEdits } from './overlayTitleEdits';
import type { EditableColumns, EditScope } from './EditableColumns';
import type { SubjectKeys } from './subjectKeysOf';
import type { TitleEditStore } from './createTitleEditStore';

/**
 * Lays the edits kept for a file's titles over what a scan is about to store for it, and hands back
 * how to note what the catalogue said under each edited field once the file is stored.
 *
 * @param store - The kept edits.
 * @param libraryId - The file's library.
 * @param keys - The titles the file belongs to.
 * @param columns - What the scan would store, before any edit.
 * @returns The columns to store, and how to note what the catalogue said.
 */
const layTitleEdits = async (
  store: Pick<TitleEditStore, 'editsFor' | 'noteCatalogue'>,
  libraryId: string,
  keys: SubjectKeys,
  columns: EditableColumns,
): Promise<{ columns: EditableColumns; noteCatalogue: () => Promise<void> }> => {
  const keyOf: Partial<Record<EditScope, string>> =
    keys.kind === 'film'
      ? { film: keys.film }
      : keys.kind === 'episode'
        ? { show: keys.show, ...(keys.episode === null ? {} : { episode: keys.episode }) }
        : {};
  const wanted = Object.values(keyOf);

  if (wanted.length === 0) {
    return { columns, noteCatalogue: () => Promise.resolve() };
  }

  const kept = await store.editsFor(libraryId, wanted);
  const laid = overlayTitleEdits(columns, {
    film: kept.filter((edit) => edit.subjectKey === keyOf.film),
    show: kept.filter((edit) => edit.subjectKey === keyOf.show),
    episode: kept.filter((edit) => edit.subjectKey === keyOf.episode),
  });

  return {
    columns: laid.columns,
    noteCatalogue: () =>
      store.noteCatalogue(
        libraryId,
        laid.catalogue.flatMap((one) => {
          const subjectKey = keyOf[one.scope];

          return subjectKey === undefined
            ? []
            : [{ subjectKey, field: one.field, value: one.value }];
        }),
      ),
  };
};

export { layTitleEdits };
