import type { View } from 'react-native';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type HomeProps = {
  viewerId: string;
  watchable: readonly string[];
  onOpen: (media: MediaSummary) => void;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  isCovered: boolean;
  onFeature: (media: MediaSummary) => void;
  upTo: View | null;
  playRef: (element: View | null) => void;
  isHeldBack: boolean;
};

export type { HomeProps };
