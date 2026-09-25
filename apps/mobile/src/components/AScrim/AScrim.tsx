import { View } from 'react-native';
import { requireNativeView } from 'expo';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import type { AScrimProps, NativeScrimProps } from './AScrim.types';

const TheScrim = requireNativeView<NativeScrimProps>('ValenceScrim');

const FILLS = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
} as const satisfies NativeScrimProps['style'];

/**
 * The web's darkening over artwork, with a blur beneath it that fades in towards the foot, filling
 * whatever holds it so that words can sit on a picture.
 *
 * @param blurReach - How far up the blur goes, as a fraction of the height.
 */
const AScrim = ({ blurReach = 0.45 }: AScrimProps) =>
  drawsNatively() ? (
    <TheScrim blurReach={blurReach} style={FILLS} pointerEvents="none" />
  ) : (
    <View style={[FILLS, { backgroundColor: 'rgba(0, 0, 0, 0.45)' }]} pointerEvents="none" />
  );

AScrim.displayName = 'AScrim';

export { AScrim };
