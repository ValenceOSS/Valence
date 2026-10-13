import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { APlayerPanel } from '@ValenceMobile/components/Watching/components/APlayerPanel/APlayerPanel';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { PLAYBACK_RATES } from '@ValenceClient/playback/PLAYBACK_RATES';
import { describePlaybackRate } from '@ValenceClient/playback/describePlaybackRate';
import type { TheSpeedProps } from './TheSpeed.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  centre: { flex: 1, justifyContent: 'center', paddingHorizontal: '10%' },
  dot: {
    backgroundColor: PLAYER_LOOK.colours.rest,
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  dotChosen: {
    backgroundColor: PLAYER_LOOK.colours.text,
    borderRadius: 14,
    height: 28,
    width: 28,
  },
  heading: { ...PLAYER_LOOK.styles.heading, marginBottom: 44, textAlign: 'center' },
  line: {
    backgroundColor: PLAYER_LOOK.colours.rest,
    height: 2,
    left: '8%',
    position: 'absolute',
    right: '8%',
    top: 13,
  },
  stop: { alignItems: 'center', gap: 16, height: 80, justifyContent: 'flex-start', width: 90 },
  stopDot: { alignItems: 'center', height: 28, justifyContent: 'center' },
  stops: { flexDirection: 'row', justifyContent: 'space-between' },
});

/**
 * How fast the film plays, as stops along a line from half speed to double — the one in force
 * drawn larger — so the whole range is seen at once and changing it is a single tap.
 *
 * @param rate - How fast it is playing.
 * @param onRate - Told the speed they want.
 * @param onClose - Told they are done.
 */
const TheSpeed = ({ rate, onRate, onClose }: TheSpeedProps) => (
  <APlayerPanel label={say('phone.watching.closeTheSpeed')} onClose={onClose}>
    <View style={styles.centre}>
      <Text style={styles.heading}>{say('common.speed')}</Text>

      <View>
        <View style={styles.line} />

        <View style={styles.stops}>
          {PLAYBACK_RATES.map((one) => {
            const isChosen = one === rate;
            const said = one === 1 ? say('phone.watching.normalSpeed') : describePlaybackRate(one);

            return (
              <Button
                key={one}
                tone="bare"
                isChosen={isChosen}
                label={said}
                onPress={() => {
                  onRate(one);
                }}
              >
                <View style={styles.stop}>
                  <View style={styles.stopDot}>
                    <View style={isChosen ? styles.dotChosen : styles.dot} />
                  </View>
                  <Text
                    style={isChosen ? PLAYER_LOOK.styles.labelChosen : PLAYER_LOOK.styles.label}
                  >
                    {said}
                  </Text>
                </View>
              </Button>
            );
          })}
        </View>
      </View>
    </View>
  </APlayerPanel>
);

TheSpeed.displayName = 'TheSpeed';

export { TheSpeed };
