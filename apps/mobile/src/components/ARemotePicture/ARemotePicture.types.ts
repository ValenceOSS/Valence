import type { ImageStyle, StyleProp } from 'react-native';

type ARemotePictureProps = {
  uri: string;
  style: StyleProp<ImageStyle>;
  fit?: 'cover' | 'contain';
  isTopKept?: boolean;
  blur?: number;
  label?: string;
  ground?: string;
  onMissing?: () => void;
  onLoad?: (size: { width: number; height: number }) => void;
};

export type { ARemotePictureProps };
