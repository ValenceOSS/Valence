import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CatalogueView } from '@ValenceClient/requests/CatalogueView.types';

/**
 * Whether a title is one of the kind a tab is narrowed to: artists or albums for music, ebooks or
 * audiobooks for books, or anything.
 *
 * @param entry - The title.
 * @param kind - What the tab is narrowed to.
 * @returns Whether it is.
 */
const isOfKind = (entry: CatalogueEntry, kind: CatalogueView['kind']): boolean => {
  switch (kind) {
    case 'all':
      return true;
    case 'artist':
    case 'album':
      return entry.kind === kind;
    case 'ebook':
      return entry.kind === 'book' && !entry.isAudio;
    case 'audiobook':
      return entry.kind === 'book' && entry.isAudio;
  }
};

/**
 * The Catalogue's titles as a view of it shows them: those of its tab, status and kind, whose title
 * or the name beside it has the words looked for, newest first or by title.
 *
 * @param entries - Every title.
 * @param view - What is shown.
 * @returns The titles shown, in order.
 */
const catalogueShown = (
  entries: readonly CatalogueEntry[],
  view: CatalogueView,
): CatalogueEntry[] => {
  const query = view.query.trim().toLocaleLowerCase();

  return entries
    .filter(
      (entry) =>
        entry.tab === view.tab &&
        (view.status === 'all' || entry.status === view.status) &&
        isOfKind(entry, view.kind) &&
        (query === '' ||
          entry.title.toLocaleLowerCase().includes(query) ||
          (entry.subtitle ?? '').toLocaleLowerCase().includes(query)),
    )
    .toSorted((left, right) =>
      view.sort === 'title'
        ? left.title.localeCompare(right.title)
        : (right.addedAt ?? '').localeCompare(left.addedAt ?? '') ||
          left.title.localeCompare(right.title),
    );
};

export { catalogueShown };
