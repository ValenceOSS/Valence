import { CATALOGUE_TABS } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CatalogueTab } from '@ValenceContracts/schemas/AdminCatalogue';
import type { Library } from '@ValenceContracts/schemas/Library';

const LIBRARY_KIND_OF: Readonly<Record<CatalogueTab, Library['kind']>> = {
  films: 'movies',
  shows: 'shows',
  music: 'music',
  books: 'books',
};

/**
 * The Catalogue's tabs on this server: one for each kind of library it has, so a server with no
 * music library has no Music tab. Every tab while the libraries are not yet known.
 *
 * @param libraries - The server's libraries, where they are known.
 * @returns The tabs, in order.
 */
const catalogueTabsOf = (
  libraries: readonly Pick<Library, 'kind'>[] | undefined,
): CatalogueTab[] =>
  libraries === undefined
    ? [...CATALOGUE_TABS]
    : CATALOGUE_TABS.filter((tab) =>
        libraries.some((library) => library.kind === LIBRARY_KIND_OF[tab]),
      );

export { catalogueTabsOf };
