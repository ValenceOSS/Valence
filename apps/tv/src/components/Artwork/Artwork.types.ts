import type { StyleProp, ViewStyle } from 'react-native';

type ArtworkProps = {
  path: string | null;
  style?: StyleProp<ViewStyle>;
  fit?: 'cover' | 'contain';
  onMissing?: () => void;
  anchor?: 'left' | 'center';
  isUrgent?: boolean;
};

export type { ArtworkProps };
