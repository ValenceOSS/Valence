import { requireNativeView } from 'expo';
import type { AFadedEdgeProps, NativeFadedEdgesProps } from './AFadedEdge.types';

const TheFade = requireNativeView<NativeFadedEdgesProps>('ValenceFadedEdges');

const FILLS = { flex: 1 } as const satisfies NativeFadedEdgesProps['style'];

/**
 * Whatever is inside, faded out over its leading and trailing edges rather than cut off square.
 *
 * @param leading - How many points the leading edge fades over.
 * @param trailing - How many points the trailing edge fades over.
 * @param children - What fades.
 */
const AFadedEdge = ({ leading, trailing, children }: AFadedEdgeProps) => (
  <TheFade leading={leading} trailing={trailing} style={FILLS}>
    {children}
  </TheFade>
);

AFadedEdge.displayName = 'AFadedEdge';

export { AFadedEdge };
