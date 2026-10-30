import { StyleSheet, View } from 'react-native';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import type { APlayerCapsuleProps } from './APlayerCapsule.types';

const styles = StyleSheet.create({
  capsule: {
    alignItems: 'center',
    backgroundColor: PLAYER_LOOK.colours.chip,
    borderRadius: PLAYER_LOOK.slot / 2,
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
});

/**
 * A soft capsule over the picture holding a player's own controls side by side, as every player in
 * the app gathers them along its top.
 *
 * @param children - The controls.
 */
const APlayerCapsule = ({ children }: APlayerCapsuleProps) => (
  <View style={styles.capsule} pointerEvents="box-none">
    {children}
  </View>
);

APlayerCapsule.displayName = 'APlayerCapsule';

export { APlayerCapsule };
