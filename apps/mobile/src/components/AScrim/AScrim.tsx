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

const RISING =
  'linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.4) 38%, rgba(0, 0, 0, 0) 72%)';

const LEADING =
  'linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.15) 45%, rgba(0, 0, 0, 0) 70%)';

/**
 * The web's darkening over artwork, with a blur beneath it that fades in towards the foot, filling
 * whatever holds it so that words can sit on a picture. A phone that cannot blur what is behind a
 * view, which is every Android phone, lays the same two gradients without it.
 *
 * @param blurReach - How far up the blur goes, as a fraction of the height.
 */
const AScrim = ({ blurReach = 0.45 }: AScrimProps) =>
  drawsNatively() ? (
    <TheScrim blurReach={blurReach} style={FILLS} pointerEvents="none" />
  ) : (
    <View style={FILLS} pointerEvents="none">
      <View style={[FILLS, { experimental_backgroundImage: RISING }]} />
      <View style={[FILLS, { experimental_backgroundImage: LEADING }]} />
    </View>
  );

AScrim.displayName = 'AScrim';

export { AScrim };
