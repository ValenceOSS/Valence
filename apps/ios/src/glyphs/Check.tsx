import { Svg, Path } from 'react-native-svg';
import type { GlyphProps } from '@ValencePhone/components/Icon/Icon.types';

const Check = ({ size, colour }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colour} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12L9.66667 17L19 7" />
  </Svg>
);

Check.displayName = 'Check';

export { Check };
