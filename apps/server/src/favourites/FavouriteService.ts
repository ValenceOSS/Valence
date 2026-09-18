import type { Favourite, FavouriteBook } from '@ValenceContracts/schemas/Favourite';

type FavouriteService = {
  list: (profileId: string) => Promise<Favourite[]>;
  keep: (profileId: string, mediaId: string) => Promise<void>;
  drop: (profileId: string, mediaId: string) => Promise<void>;
  listBooks: (profileId: string) => Promise<FavouriteBook[]>;
  keepBook: (profileId: string, bookId: string) => Promise<void>;
  dropBook: (profileId: string, bookId: string) => Promise<void>;
};

export type { FavouriteService };
