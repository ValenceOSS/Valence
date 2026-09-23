import { StyleSheet, View } from 'react-native';
import { Volume2, VolumeX } from 'lucide-react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
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
    label={isMuted ? 'Turn the sound on' : 'Turn the sound off'}
    onPress={onToggle}
  >
    <View style={styles.reach}>
      <Icon of={isMuted ? VolumeX : Volume2} size={22} colour="#ffffff" />
    </View>
  </Button>
);

ASoundSwitch.displayName = 'ASoundSwitch';

export { ASoundSwitch };
