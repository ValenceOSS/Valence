import type { StyleProp, ViewStyle } from 'react-native';

type PreviewBackdropProps = {
  mediaId: string;
  stillPath: string | null;
  isPlaying: boolean;
  style?: StyleProp<ViewStyle>;
};

export type { PreviewBackdropProps };
