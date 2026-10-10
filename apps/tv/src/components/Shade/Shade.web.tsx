import { View } from 'react-native';
import type { ShadeProps } from './Shade.types';

/**
 * Darkens part of a picture so what is written over it stays readable, as one flat colour in a
 * television's browser.
 *
 * A gradient there is drawn by the browser rather than by the television's graphics, and several of
 * them over moving pictures were part of what made the TV layout slow on an LG set. A flat shade
 * keeps the words readable for the cost of filling a box.
 *
 * @param flat - The colour drawn.
 * @param style - Its size and place.
 */
const Shade = ({ flat, style }: ShadeProps) => (
  <View style={[style, { backgroundColor: flat }]} pointerEvents="none" />
);

Shade.displayName = 'Shade';

export { Shade };
