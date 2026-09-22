import { Svg, Path } from 'react-native-svg';
import type { GlyphProps } from '@ValencePhone/components/Icon/Icon.types';

const ChevronLeft = ({ size, colour }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colour} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 6L9 12L15 18" />
  </Svg>
);

ChevronLeft.displayName = 'ChevronLeft';

export { ChevronLeft };
