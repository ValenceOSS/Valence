import type { CatalogueTab } from '@ValenceContracts/schemas/AdminCatalogue';
import type { Library } from '@ValenceContracts/schemas/Library';

const LIBRARY_KIND_OF_TAB: Readonly<Record<CatalogueTab, Library['kind']>> = {
  films: 'movies',
  shows: 'shows',
  music: 'music',
  books: 'books',
};

export { LIBRARY_KIND_OF_TAB };
