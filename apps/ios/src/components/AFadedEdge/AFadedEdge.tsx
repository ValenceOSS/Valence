import { requireNativeView } from 'expo';
import type { AFadedEdgeProps, NativeFadedEdgesProps } from './AFadedEdge.types';

const TheFade = requireNativeView<NativeFadedEdgesProps>('ValenceFadedEdges');

const ACROSS = { alignSelf: 'stretch' } as const satisfies NativeFadedEdgesProps['style'];

const FILLS = { flex: 1 } as const satisfies NativeFadedEdgesProps['style'];

/**
 * Whatever is inside, faded out over its leading and trailing edges rather than cut off square — or,
 * upright, over its top and bottom, filling the room it is given.
 *
 * @param leading - How many points the leading edge, or the top, fades over.
 * @param trailing - How many points the trailing edge, or the bottom, fades over.
 * @param isUpright - Whether it fades at the top and bottom rather than the sides.
 * @param children - What fades.
 */
const AFadedEdge = ({ leading, trailing, isUpright = false, children }: AFadedEdgeProps) => (
  <TheFade
    leading={leading}
    trailing={trailing}
    isUpright={isUpright}
    style={isUpright ? FILLS : ACROSS}
  >
    {children}
  </TheFade>
);

AFadedEdge.displayName = 'AFadedEdge';

export { AFadedEdge };
