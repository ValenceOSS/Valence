import { StyleSheet, View } from 'react-native';
import { requireNativeView } from 'expo';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AirPlayButtonProps, NativeAirPlayProps } from './AirPlayButton.types';

const ThePicker = requireNativeView<NativeAirPlayProps>('ValenceAirPlay');

const ROUND = 40;

const styles = StyleSheet.create({
  whole: { alignItems: 'center', height: ROUND, justifyContent: 'center', width: ROUND },
});

/**
 * The system's AirPlay button, and the only place it is drawn: pressed, it lists the speakers and
 * screens nearby, and what plays afterwards follows the one chosen. It sits on glass where the
 * phone has it, and bare where it does not. While something plays over AirPlay it is filled in, the
 * icon cut out of it, as every button that is on is drawn.
 *
 * @param isOverPicture - Whether it sits over a film, where it is drawn white and bare like every
 *   other control over the picture, whatever the theme.
 */
const AirPlayButton = ({ isOverPicture = false }: AirPlayButtonProps) => {
  const colours = useTheColours();

  if (!drawsNatively()) {
    return null;
  }

  return (
    <View style={styles.whole}>
      {hasLiquidGlass() && !isOverPicture ? <AGlass roundness={ROUND / 2} /> : null}
      <ThePicker
        colour={isOverPicture ? '#ffffff' : colours.text}
        activeColour={isOverPicture ? '#000000' : colours.accentContrast}
        style={{ height: ROUND, width: ROUND }}
        accessibilityLabel="Play on another device"
      />
    </View>
  );
};

AirPlayButton.displayName = 'AirPlayButton';

export { AirPlayButton };
