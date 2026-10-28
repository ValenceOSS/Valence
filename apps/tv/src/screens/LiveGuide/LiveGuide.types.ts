import type { View } from 'react-native';

type LiveGuideProps = {
  onWatch: (channelId: string) => void;
  upTo: View | null;
  cameBackTo: { channelId: string } | null;
  isCovered: boolean;
};

export type { LiveGuideProps };
