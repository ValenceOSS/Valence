import type { ATrackRowProps } from '@ValenceMobile/components/ATrackRow/ATrackRow.types';

type ATrackListRowProps = Omit<ATrackRowProps, 'isCurrent' | 'isPlaying'> & {
  isFirst: boolean;
};

export type { ATrackListRowProps };
