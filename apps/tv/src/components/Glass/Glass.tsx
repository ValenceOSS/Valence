import { requireNativeView } from 'expo';
import type { GlassProps } from './Glass.types';

const NativeGlass = requireNativeView<GlassProps>('ValenceGlass');

/**
 * The system's Liquid Glass behind what it holds, as the television's own bars and panels are drawn
 * from tvOS 26: it refracts and tints what lies behind it and catches the light along its edge. On an
 * older television it is Apple's dark frosted blur instead.
 *
 * @param cornerRadius - How rounded it is; more than half its height makes a capsule.
 * @param style - How it is laid out.
 * @param children - What sits on the glass.
 */
const Glass = ({ cornerRadius, style, children }: GlassProps) => (
  <NativeGlass cornerRadius={cornerRadius} style={style}>
    {children}
  </NativeGlass>
);

Glass.displayName = 'Glass';

export { Glass };
