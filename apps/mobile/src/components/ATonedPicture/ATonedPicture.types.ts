import type { ImageStyle, StyleProp } from 'react-native';
import type { PictureTone } from '@ValenceCore/pictures/PictureTone';

type ATonedPictureProps = {
  uri: string;
  tone: PictureTone | null;
  style?: StyleProp<ImageStyle>;
  onLoad?: (size: { width: number; height: number }) => void;
  onMissing?: () => void;
};

export type { ATonedPictureProps };
