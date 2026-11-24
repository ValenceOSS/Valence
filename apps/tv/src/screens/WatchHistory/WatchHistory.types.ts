import type { View } from 'react-native';

type WatchHistoryProps = {
  onOpen: (wanted: { kind: 'film' | 'show'; mediaId: string; seriesId?: string | null }) => void;
  onPlay: (mediaId: string, startSeconds: number) => void;
  onMood: (path: string | null) => void;
  upTo: View | null;
};

export type { WatchHistoryProps };
