import { StyleSheet, View } from 'react-native';
import { requireNativeView } from 'expo';
import { AGlass } from '@ValencePhone/components/AGlass/AGlass';
import { hasLiquidGlass } from '@ValencePhone/platform/hasLiquidGlass';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { NativeAirPlayProps } from './AirPlayButton.types';

const ThePicker = requireNativeView<NativeAirPlayProps>('ValenceAirPlay');

const ROUND = 40;

const styles = StyleSheet.create({
  whole: { alignItems: 'center', height: ROUND, justifyContent: 'center', width: ROUND },
});

/**
 * The system's AirPlay button, and the only place it is drawn: pressed, it lists the speakers and
 * screens nearby, and what plays afterwards follows the one chosen. It sits on glass where the
 * phone has it, and bare where it does not.
 */
const AirPlayButton = () => {
  const colours = useTheColours();

  return (
    <View style={styles.whole}>
      {hasLiquidGlass() ? <AGlass roundness={ROUND / 2} /> : null}
      <ThePicker
        colour={colours.text}
        activeColour={colours.accent}
        style={{ height: ROUND, width: ROUND }}
        accessibilityLabel="Play on another device"
      />
    </View>
  );
};

AirPlayButton.displayName = 'AirPlayButton';

export { AirPlayButton };
