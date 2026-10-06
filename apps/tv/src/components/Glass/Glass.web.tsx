import { FlatGlass } from '@ValenceTv/components/Glass/components/FlatGlass/FlatGlass';
import type { GlassProps } from './Glass.types';

/**
 * Glass for a television's browser, which draws it flat, as Android does.
 *
 * @param cornerRadius - How rounded it is; more than half its height makes a capsule.
 * @param style - How it is laid out.
 * @param children - What sits on the glass.
 */
const Glass = ({ cornerRadius, style, children }: GlassProps) => (
  <FlatGlass cornerRadius={cornerRadius} style={style}>
    {children}
  </FlatGlass>
);

Glass.displayName = 'Glass';

export { Glass };
