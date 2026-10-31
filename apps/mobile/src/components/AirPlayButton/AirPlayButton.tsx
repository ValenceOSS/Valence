import { Airplay } from '@keyline-icons/react-native/fill';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { requireNativeView } from 'expo';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AirPlayButtonProps, NativeAirPlayProps } from './AirPlayButton.types';
import { say } from '@ValenceI18n/say';

const ThePicker = requireNativeView<NativeAirPlayProps>('ValenceAirPlay');

const ROUND = 40;

const UNSEEN = 'transparent';

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  whole: { alignItems: 'center', height: ROUND, justifyContent: 'center', width: ROUND },
});

/**
 * The system's AirPlay button, and the only place it is drawn: pressed, it lists the speakers and
 * screens nearby, and what plays afterwards follows the one chosen. It sits on glass where the
 * phone has it, and bare where it does not. Its mark is the app's own solid AirPlay icon, drawn
 * beneath the system's button, whose own mark is left unseen so only its press is felt. Where it is
 * the whole of a larger tile, the system's button is drawn as it is, filled in while something plays
 * over AirPlay.
 *
 * @param isOverPicture - Whether it sits over a film, where it is drawn white and bare like every
 *   other control over the picture, whatever the theme.
 * @param isBare - Whether it is drawn without glass of its own, where it sits in a circle drawn
 *   around it, as among the player's round actions.
 * @param fills - The room to fill, bare, where it is the whole of a larger tile drawn around it, so
 *   a press anywhere on the tile opens the list.
 */
const AirPlayButton = ({ isOverPicture = false, isBare = false, fills }: AirPlayButtonProps) => {
  const colours = useTheColours();

  if (!drawsNatively()) {
    return null;
  }

  if (fills !== undefined) {
    return (
      <ThePicker
        colour={colours.text}
        activeColour={colours.accentContrast}
        style={fills}
        accessibilityLabel={say('common.playOnAnotherDevice')}
      />
    );
  }

  return (
    <View style={styles.whole}>
      {hasLiquidGlass() && !isOverPicture && !isBare ? <AGlass roundness={ROUND / 2} /> : null}
      <View style={styles.mark} pointerEvents="none">
        <Icon of={Airplay} size={24} colour={isOverPicture ? '#ffffff' : colours.text} />
      </View>
      <ThePicker
        colour={UNSEEN}
        activeColour={UNSEEN}
        style={{ height: ROUND, width: ROUND }}
        accessibilityLabel={say('common.playOnAnotherDevice')}
      />
    </View>
  );
};

AirPlayButton.displayName = 'AirPlayButton';

export { AirPlayButton };
