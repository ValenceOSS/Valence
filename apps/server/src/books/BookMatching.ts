import type { OpenLibraryBook } from '@ValenceServer/requests/openLibrary/OpenLibraryBook';
import type { OpenLibraryDescription } from '@ValenceServer/requests/openLibrary/describeOpenLibraryBook';

type BookMatching = {
  search: (query: string) => Promise<OpenLibraryBook[]>;
  describe: (openLibraryId: number) => Promise<OpenLibraryDescription | null>;
  picture: (url: string) => Promise<Uint8Array | null>;
};

export type { BookMatching };
