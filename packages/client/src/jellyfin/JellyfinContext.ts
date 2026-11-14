import type { JellyfinIdBook } from '@ValenceClient/jellyfin/createJellyfinIdBook';

type JellyfinContext = {
  address: string;
  token: string;
  userId: string;
  book: JellyfinIdBook;
};

export type { JellyfinContext };
