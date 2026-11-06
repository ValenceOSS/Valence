import type { TitleShow, TitleSort } from '@ValenceContracts/schemas/TitleList';

type TitleListAsk = {
  libraryId: string;
  sort: TitleSort;
  isDescending: boolean;
  search: string;
  show: TitleShow;
  filters: readonly string[];
};

export type { TitleListAsk };
