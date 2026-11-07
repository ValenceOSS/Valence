import { StyleSheet, View } from 'react-native';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { Words } from '@ValenceMobile/components/Words/Words';
import type { ALabelledToggleProps } from './ALabelledToggle.types';

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  said: { flex: 1 },
});

/**
 * A switch with what it turns on written beside it, so nobody is left guessing what it does.
 *
 * @param label - What it turns on.
 * @param isOn - Whether it is.
 * @param onToggle - Told what it was turned to.
 * @param isDisabled - Whether it can be touched.
 */
const ALabelledToggle = ({ label, isOn, onToggle, isDisabled = false }: ALabelledToggleProps) => (
  <View style={styles.row}>
    <View style={styles.said}>
      <Words>{label}</Words>
    </View>
    <Toggle label={label} isOn={isOn} onToggle={onToggle} isDisabled={isDisabled} />
  </View>
);

ALabelledToggle.displayName = 'ALabelledToggle';

export { ALabelledToggle };
