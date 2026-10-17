import type { EpisodeSeason } from '@ValenceScreens/components/VideoPlayer/components/EpisodeMenu/EpisodeMenu.types';

type SeasonLineProps = {
  season: EpisodeSeason;
  name: string;
  isOn: boolean;
  isMoving: boolean;
  watchedCount: number;
  onChoose: () => void;
};

export type { SeasonLineProps };
