import { requireNativeView } from 'expo';
import type { AGlassProps, NativeGlassProps } from './AGlass.types';

const TheGlass = requireNativeView<NativeGlassProps>('ValenceGlass');

const FILLS = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
} as const satisfies NativeGlassProps['style'];

/**
 * The system's liquid glass, filling whatever holds it, for a control drawn over it to sit on.
 * Only asked for on a phone that has liquid glass.
 *
 * @param roundness - How round its corners are.
 * @param tint - A colour to tint it, as a chosen control is.
 * @param isShown - Whether it is there, easing in and out when that changes.
 */
const AGlass = ({ roundness, tint, isShown = true }: AGlassProps) => (
  <TheGlass
    roundness={roundness}
    isShown={isShown}
    {...(tint === undefined ? {} : { tint })}
    style={FILLS}
    pointerEvents="none"
  />
);

AGlass.displayName = 'AGlass';

export { AGlass };
