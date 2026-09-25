import { Volume, VolumeX } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { say } from '@ValenceI18n/say';
import type { ASoundSwitchProps } from './ASoundSwitch.types';

const styles = StyleSheet.create({
  reach: { padding: 14 },
});

/**
 * The switch that turns a preview's sound on and off, drawn over the preview it belongs to.
 *
 * @param isMuted - Whether the preview is silent.
 * @param onToggle - Told to turn the sound the other way.
 */
const ASoundSwitch = ({ isMuted, onToggle }: ASoundSwitchProps) => (
  <Button
    tone="bare"
    label={isMuted ? say('phone.aSoundSwitch.turnOn') : say('phone.aSoundSwitch.turnOff')}
    onPress={onToggle}
  >
    <View style={styles.reach}>
      <Icon of={isMuted ? VolumeX : Volume} size={22} colour="#ffffff" />
    </View>
  </Button>
);

ASoundSwitch.displayName = 'ASoundSwitch';

export { ASoundSwitch };
