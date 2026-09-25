import { View } from 'react-native';
import { Play as PlayOutline } from '@keyline-icons/react-native';
import { Play } from '@keyline-icons/react-native/fill';
import type { IconProps } from './Icon.types';

const POINTS_RIGHT = new Set([Play, PlayOutline]);

const NUDGED_BY = 0.05;

/**
 * One of Valence's icons: the one component that draws an icon on the television, as ValenceUI's
 * `Icon` is on the web. The icons are Keyline's native set, drawn from the same pictures as the
 * web's, so an icon changes in one place for every client and nobody draws one by hand.
 *
 * A triangle pointing right is centred by eye rather than by its box, a little to the right, since
 * its weight sits towards its flat side and it otherwise looks off-centre in a round button.
 *
 * @param of - Which icon.
 * @param size - How wide and tall it is.
 * @param colour - What colour it is drawn in.
 */
const Icon = ({ of: Drawn, size = 32, colour }: IconProps) =>
  POINTS_RIGHT.has(Drawn) ? (
    <View style={{ transform: [{ translateX: size * NUDGED_BY }] }}>
      <Drawn size={size} color={colour} />
    </View>
  ) : (
    <Drawn size={size} color={colour} />
  );

Icon.displayName = 'Icon';

export { Icon };
