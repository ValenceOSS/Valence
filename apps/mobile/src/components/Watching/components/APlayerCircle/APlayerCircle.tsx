import { StyleSheet, View } from 'react-native';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import type { APlayerCircleProps } from './APlayerCircle.types';

const SIDES = { slot: PLAYER_LOOK.slot, small: 62, big: 84 } as const;

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    backgroundColor: PLAYER_LOOK.colours.chip,
    justifyContent: 'center',
  },
});

/**
 * A soft round button over the picture, as every player in the app draws its controls: what it
 * holds in the middle of a faint disc, at one of three sizes — a control's own, a step either side
 * of play, and play itself.
 *
 * @param children - What is drawn in it.
 * @param size - How large it is.
 */
const APlayerCircle = ({ children, size = 'slot' }: APlayerCircleProps) => {
  const side = SIDES[size];

  return (
    <View style={[styles.circle, { borderRadius: side / 2, height: side, width: side }]}>
      {children}
    </View>
  );
};

APlayerCircle.displayName = 'APlayerCircle';

export { APlayerCircle };
