import { StyleSheet, Text, View } from 'react-native';
import { ASystemSlider } from '@ValenceMobile/components/ASystemSlider/ASystemSlider';
import { APlayerPanel } from '@ValenceMobile/components/Watching/components/APlayerPanel/APlayerPanel';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { PLAYBACK_RATES } from '@ValenceClient/playback/PLAYBACK_RATES';
import { describePlaybackRate } from '@ValenceClient/playback/describePlaybackRate';
import type { TheSpeedProps } from './TheSpeed.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  stop: { alignItems: 'center', width: 76 },
  stops: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -26 },
  whole: { gap: 10, paddingBottom: 6, paddingHorizontal: '16%' },
});

/**
 * How fast the film plays, on the system's own slider stepping from half speed to double, along the
 * foot of the picture so the film stays in view while it changes. Each stop is named beneath it, the
 * one in force drawn bolder.
 *
 * @param rate - How fast it is playing.
 * @param onRate - Told each speed as the slider reaches it.
 * @param onClose - Told they are done.
 */
const TheSpeed = ({ rate, onRate, onClose }: TheSpeedProps) => {
  const at = Math.max(
    0,
    PLAYBACK_RATES.findIndex((one) => one === rate),
  );
  const choose = (step: number) => {
    const chosen = PLAYBACK_RATES[step];

    if (chosen !== undefined) {
      onRate(chosen);
    }
  };

  return (
    <APlayerPanel label={say('phone.watching.closeTheSpeed')} onClose={onClose} isAlongTheFoot>
      <View style={styles.whole}>
        <ASystemSlider
          label={say('common.speed')}
          value={at}
          furthest={PLAYBACK_RATES.length - 1}
          tint={PLAYER_LOOK.colours.text}
          onScrubbing={choose}
          onScrubbed={choose}
        />

        <View style={styles.stops}>
          {PLAYBACK_RATES.map((one, place) => (
            <View key={one} style={styles.stop}>
              <Text
                style={place === at ? PLAYER_LOOK.styles.labelChosen : PLAYER_LOOK.styles.label}
              >
                {describePlaybackRate(one)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </APlayerPanel>
  );
};

TheSpeed.displayName = 'TheSpeed';

export { TheSpeed };
