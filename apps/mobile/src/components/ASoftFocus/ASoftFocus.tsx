import { View } from 'react-native';
import { requireNativeView } from 'expo';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import type { ASoftFocusProps } from './ASoftFocus.types';

const TheFocus = requireNativeView<ASoftFocusProps>('ValenceSoftFocus');

/**
 * Whatever is inside, out of focus by as much as asked, easing from one blur to the next — as the
 * web blurs the lines of a song's words away from the one being sung.
 *
 * @param radius - How blurred, in points, as a CSS blur is measured; nothing is sharp.
 * @param children - What is blurred.
 */
const ASoftFocus = ({ radius, children }: ASoftFocusProps) =>
  drawsNatively() ? (
    <TheFocus radius={radius}>{children}</TheFocus>
  ) : (
    <View style={{ opacity: radius > 0 ? 0.5 : 1 }}>{children}</View>
  );

ASoftFocus.displayName = 'ASoftFocus';

export { ASoftFocus };
