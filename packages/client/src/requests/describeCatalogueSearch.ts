import type { CatalogueSearch } from '@ValenceContracts/schemas/CatalogueTitle';
import { say } from '@ValenceI18n/say';

/**
 * What the page of everything a search found of one kind is called.
 *
 * @param searching - The words, and which kind.
 * @returns The heading.
 */
const describeCatalogueSearch = (searching: CatalogueSearch): string =>
  searching.kind === 'film'
    ? say('common.filmsForQuery', { query: searching.query })
    : say('common.showsForQuery', { query: searching.query });

export { describeCatalogueSearch };
