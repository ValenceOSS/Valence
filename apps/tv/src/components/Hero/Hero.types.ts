import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type HeroProps = {
  items: readonly MediaSummary[];
  progress: ReadonlyMap<string, WatchProgress>;
  isCovered: boolean;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  onInspect: (media: MediaSummary) => void;
  onFeature?: (media: MediaSummary) => void;
};

export type { HeroProps };
