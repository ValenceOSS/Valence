import type { View } from 'react-native';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import type { MediaCardShape } from '@ValenceTv/components/MediaCard/MediaCard.types';

type ShelfProps = {
  title: string;
  items: readonly MediaSummary[];
  progress: ReadonlyMap<string, WatchProgress>;
  onOpen: (media: MediaSummary) => void;
  shape?: MediaCardShape;
  areEpisodes?: boolean;
  isUrgent?: boolean;
  onFocus?: (media: MediaSummary) => void;
  upTo?: View | null;
};

export type { ShelfProps };
