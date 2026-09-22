import { requireNativeView } from 'expo';
import type { AFadedEdgeProps, NativeFadedEdgesProps } from './AFadedEdge.types';

const TheFade = requireNativeView<NativeFadedEdgesProps>('ValenceFadedEdges');

const ACROSS = { alignSelf: 'stretch' } as const satisfies NativeFadedEdgesProps['style'];

/**
 * Whatever is inside, faded out over its leading and trailing edges rather than cut off square.
 *
 * @param leading - How many points the leading edge fades over.
 * @param trailing - How many points the trailing edge fades over.
 * @param children - What fades.
 */
const AFadedEdge = ({ leading, trailing, children }: AFadedEdgeProps) => (
  <TheFade leading={leading} trailing={trailing} style={ACROSS}>
    {children}
  </TheFade>
);

AFadedEdge.displayName = 'AFadedEdge';

export { AFadedEdge };
