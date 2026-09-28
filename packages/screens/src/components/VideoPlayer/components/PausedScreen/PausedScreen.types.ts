import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type PausedScreenProps = {
  media: Pick<MediaSummary, 'id' | 'title'> &
    Partial<Pick<MediaSummary, 'seriesTitle' | 'seasonNumber' | 'episodeNumber'>>;
  isShown: boolean;
};

export type { PausedScreenProps };
