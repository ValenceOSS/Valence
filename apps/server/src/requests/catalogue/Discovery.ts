import type { CatalogueGenre } from '@ValenceContracts/schemas/CatalogueTitle';
import type { OpenLibraryBook } from '@ValenceServer/requests/openLibrary/OpenLibraryBook';
import type { CatalogueLookup } from '@ValenceServer/requests/catalogue/CatalogueLookup';
import type { DescriptionSources } from '@ValenceServer/requests/catalogue/describeCatalogueTitle';
import type { ShelfSources } from '@ValenceServer/requests/catalogue/discoverShelves';
import type { CataloguePaged, CatalogueSearching } from '@ValenceServer/library/MetadataProvider';

type Discovery = ShelfSources &
  DescriptionSources & {
    lookup: CatalogueLookup;
    genres: (kind: 'tv' | 'movie') => Promise<CatalogueGenre[]>;
    search: (searching: CatalogueSearching) => Promise<CataloguePaged>;
    searchBooks: (query: string) => Promise<OpenLibraryBook[]>;
  };

export type { Discovery };
