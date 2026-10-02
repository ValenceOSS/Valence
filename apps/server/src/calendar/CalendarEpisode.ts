import type { ShowSummary } from '@ValenceContracts/schemas/Show';

type CalendarEpisode = {
  show: ShowSummary;
  externalId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDate: string;
  stillUrl: string | null;
  isHeld: boolean;
};

export type { CalendarEpisode };
