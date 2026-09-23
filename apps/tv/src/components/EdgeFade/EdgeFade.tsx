import { requireNativeView } from 'expo';
import type { EdgeFadeProps } from './EdgeFade.types';

const NativeFade = requireNativeView<EdgeFadeProps>('ValenceEdgeFade');

/**
 * Fades what it holds out to nothing towards one edge, so a picture melts into the glow behind the
 * page rather than into a painted band of the page's colour.
 *
 * @param edge - The edge it fades out towards.
 * @param reach - How far across, as a share of its size, it has fully faded in.
 * @param style - How it is laid out.
 * @param children - What is faded.
 */
const EdgeFade = ({ edge, reach, style, children }: EdgeFadeProps) => (
  <NativeFade edge={edge} reach={reach} style={style}>
    {children}
  </NativeFade>
);

EdgeFade.displayName = 'EdgeFade';

export { EdgeFade };
