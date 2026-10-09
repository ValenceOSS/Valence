import { LinearGradient } from 'expo-linear-gradient';
import type { ShadeProps } from './Shade.types';

/**
 * Darkens part of a picture so what is written over it stays readable, as a gradient that falls
 * away where nothing is written.
 *
 * @param colors - The gradient's colours, in order.
 * @param locations - Where each colour sits, where they are not spread evenly.
 * @param start - Where the gradient starts.
 * @param end - Where it ends.
 * @param flat - The single colour drawn in its place where a gradient is not drawn.
 * @param style - Its size and place.
 */
const Shade = ({ colors, locations, start, end, style }: ShadeProps) => (
  <LinearGradient
    colors={colors}
    {...(locations === undefined ? {} : { locations })}
    {...(start === undefined ? {} : { start })}
    {...(end === undefined ? {} : { end })}
    style={style}
    pointerEvents="none"
  />
);

Shade.displayName = 'Shade';

export { Shade };
