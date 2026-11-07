import type { CatalogueGenre } from '@ValenceContracts/schemas/CatalogueTitle';
import type { OpenLibraryBook } from '@ValenceServer/requests/openLibrary/OpenLibraryBook';
import type { OpenLibraryAbout } from '@ValenceServer/requests/openLibrary/readOpenLibraryAbout';
import type { CatalogueLookup } from '@ValenceServer/requests/catalogue/CatalogueLookup';
import type { DescriptionSources } from '@ValenceServer/requests/catalogue/describeCatalogueTitle';
import type { ShelfSources } from '@ValenceServer/requests/catalogue/discoverShelves';
import type {
  CatalogueMatch,
  CataloguePersonWork,
  CataloguePaged,
  CatalogueSearching,
} from '@ValenceServer/library/MetadataProvider';

type Discovery = ShelfSources &
  DescriptionSources & {
    lookup: CatalogueLookup;
    genres: (kind: 'tv' | 'movie') => Promise<CatalogueGenre[]>;
    search: (searching: CatalogueSearching) => Promise<CataloguePaged>;
    searchBooks: (query: string) => Promise<OpenLibraryBook[]>;
    aboutBook: (title: string, author: string | null) => Promise<OpenLibraryAbout | null>;
    personWork: (personId: number) => Promise<CataloguePersonWork>;
    similarTitles: (externalId: string, kind: 'tv' | 'movie') => Promise<CatalogueMatch[]>;
  };

export type { Discovery };
