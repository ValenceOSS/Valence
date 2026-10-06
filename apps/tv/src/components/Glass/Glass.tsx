import { Platform, View } from 'react-native';
import { requireNativeView } from 'expo';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';
import type { GlassProps } from './Glass.types';

const NativeGlass = requireNativeView<GlassProps>('ValenceGlass');

/**
 * The system's Liquid Glass behind what it holds, as the television's own bars and panels are drawn
 * from tvOS 26: it refracts and tints what lies behind it and catches the light along its edge. On an
 * older Apple TV it is Apple's dark frosted blur instead, and on Android, which cannot blur what lies
 * behind a view, it is the palette's raised surface laid nearly opaque, as the phone draws it there.
 *
 * @param cornerRadius - How rounded it is; more than half its height makes a capsule.
 * @param style - How it is laid out.
 * @param children - What sits on the glass.
 */
const Glass = ({ cornerRadius, style, children }: GlassProps) =>
  Platform.OS === 'android' ? (
    <View
      style={[
        { backgroundColor: withAlpha(tokens.colours.raised, 0.92), borderRadius: cornerRadius },
        style,
      ]}
    >
      {children}
    </View>
  ) : (
    <NativeGlass cornerRadius={cornerRadius} style={style}>
      {children}
    </NativeGlass>
  );

Glass.displayName = 'Glass';

export { Glass };
