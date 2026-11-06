import type { TITLE_TABS } from './TITLE_TABS';

type TitleTab = (typeof TITLE_TABS)[number];

type TitlePlace = {
  tab: TitleTab;
  season: number | null;
  episode: string | null;
  isSeasonPage: boolean;
};

export type { TitlePlace, TitleTab };
