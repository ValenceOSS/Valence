import { requireNativeView } from 'expo';
import type { FocusFenceProps } from './FocusFence.types';

const NativeFence = requireNativeView<FocusFenceProps>('ValenceFocusFence');

/**
 * Keeps the remote out of whatever it holds while it is shut — a page kept mounted beneath another,
 * whose buttons the remote could otherwise land on without anybody seeing them. The remote can
 * always leave it.
 *
 * @param isShut - Whether the remote is kept out.
 * @param style - How it is laid out.
 * @param children - What is fenced.
 */
const FocusFence = ({ isShut, style, children }: FocusFenceProps) => (
  <NativeFence isShut={isShut} style={style}>
    {children}
  </NativeFence>
);

FocusFence.displayName = 'FocusFence';

export { FocusFence };
