import { Svg, Path } from 'react-native-svg';
import type { GlyphProps } from '@ValencePhone/components/Icon/Icon.types';

const X = ({ size, colour }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colour} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M7 7L17 17M17 7L7 17" />
  </Svg>
);

X.displayName = 'X';

export { X };
