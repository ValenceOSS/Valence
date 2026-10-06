import { View } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';
import type { GlassProps } from '@ValenceTv/components/Glass/Glass.types';

/**
 * Glass where nothing can blur what lies behind a view: the palette's raised surface laid nearly
 * opaque, as the phone draws it on Android.
 *
 * @param cornerRadius - How rounded it is; more than half its height makes a capsule.
 * @param style - How it is laid out.
 * @param children - What sits on the glass.
 */
const FlatGlass = ({ cornerRadius, style, children }: GlassProps) => (
  <View
    style={[
      { backgroundColor: withAlpha(tokens.colours.raised, 0.92), borderRadius: cornerRadius },
      style,
    ]}
  >
    {children}
  </View>
);

FlatGlass.displayName = 'FlatGlass';

export { FlatGlass };
