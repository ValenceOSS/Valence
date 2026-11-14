import type { Viewing } from './Viewing';

type TitleHistory = {
  isSeries: boolean;
  viewings: readonly Viewing[];
  stars: number | null;
  isFavourite: boolean;
};

export type { TitleHistory };
