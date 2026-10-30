import { requireNativeView } from 'expo';
import type { LiftOnFocusProps } from './LiftOnFocus.types';

const NativeLift = requireNativeView<LiftOnFocusProps>('ValenceFocusLift');

/**
 * Lifts what it holds as the remote lands on anything inside it, and lets it down as the remote
 * leaves. The television's focus engine drives it directly, in the same animation as the move
 * itself, so the lift never waits on JavaScript hearing that focus has moved.
 *
 * @param scale - How far it lifts.
 * @param shadowHeight - How far down from its top a shadow is cast while lifted, or nothing for
 *   none.
 * @param cornerRadius - How rounded the shadow's outline is, to match what casts it.
 * @param shadowReach - How far the shadow spreads, where shorter than the television's own.
 * @param isAnchoredLeft - Whether it grows from its left edge, as a row in a list does, rather than
 *   from its middle.
 * @param style - How it is laid out.
 * @param children - What is lifted.
 */
const LiftOnFocus = ({
  scale,
  shadowHeight,
  cornerRadius,
  shadowReach,
  isAnchoredLeft,
  style,
  children,
}: LiftOnFocusProps) => (
  <NativeLift
    scale={scale}
    shadowHeight={shadowHeight}
    cornerRadius={cornerRadius}
    {...(shadowReach === undefined ? {} : { shadowReach })}
    isAnchoredLeft={isAnchoredLeft}
    style={style}
  >
    {children}
  </NativeLift>
);

LiftOnFocus.displayName = 'LiftOnFocus';

export { LiftOnFocus };
