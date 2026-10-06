import { TVFocusGuideView } from 'react-native';
import type { FocusGuideProps } from './FocusGuide.types';

/**
 * A part of the screen that shapes where the remote goes inside it: coming back to what was last
 * landed on there, and keeping the remote in on any side it traps. On tvOS and Android TV this is
 * the system's own focus guide.
 *
 * @param isRemembering - Whether coming back in lands on what was last landed on inside.
 * @param trapsUp - Whether pressing up stays inside.
 * @param trapsDown - Whether pressing down stays inside.
 * @param trapsLeft - Whether pressing left stays inside.
 * @param trapsRight - Whether pressing right stays inside.
 * @param onFocusInside - Told when the remote lands on anything inside.
 * @param style - How it is laid out.
 * @param children - What is inside.
 */
const FocusGuide = ({
  isRemembering = false,
  trapsUp = false,
  trapsDown = false,
  trapsLeft = false,
  trapsRight = false,
  onFocusInside,
  style,
  children,
}: FocusGuideProps) => (
  <TVFocusGuideView
    autoFocus={isRemembering}
    trapFocusUp={trapsUp}
    trapFocusDown={trapsDown}
    trapFocusLeft={trapsLeft}
    trapFocusRight={trapsRight}
    {...(onFocusInside === undefined ? {} : { onFocusCapture: onFocusInside })}
    style={style}
  >
    {children}
  </TVFocusGuideView>
);

FocusGuide.displayName = 'FocusGuide';

export { FocusGuide };
