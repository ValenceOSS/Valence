import { Svg, Path } from 'react-native-svg';
import type { GlyphProps } from '@ValencePhone/components/Icon/Icon.types';

const Pause = ({ size, colour }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colour} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 5C5 4.447715 5.447715 4 6 4L8 4C8.552285 4 9 4.447715 9 5L9 19C9 19.552285 8.552285 20 8 20L6 20C5.447715 20 5 19.552285 5 19ZM15 5C15 4.447715 15.447715 4 16 4L18 4C18.552285 4 19 4.447715 19 5L19 19C19 19.552285 18.552285 20 18 20L16 20C15.447715 20 15 19.552285 15 19Z" />
  </Svg>
);

Pause.displayName = 'Pause';

export { Pause };
