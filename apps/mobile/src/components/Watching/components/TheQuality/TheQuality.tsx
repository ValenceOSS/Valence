import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { TheQualityProps } from './TheQuality.types';

const SAID_APART = ' · ';

const { colours } = PLAYER_LOOK;

const styles = StyleSheet.create({
  detail: { fontFamily: FONTS.sans.medium, fontSize: 12 },
  disabled: { opacity: 0.35 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 24, paddingTop: 18 },
  label: { fontFamily: FONTS.sans.bold, fontSize: 20 },
  tile: { borderRadius: 16, gap: 4, minHeight: 96, padding: 14 },
  tileSlot: { flexBasis: '23%', flexGrow: 1 },
  whole: { flex: 1 },
});

/**
 * The qualities a film can play at, as a grid of tiles rather than a list: each names its quality
 * large with what it costs beneath, a line a fact; the one playing is solid white with dark words,
 * and one that cannot be had is dimmed.
 *
 * @param set - The heading, the qualities and which is chosen.
 */
const TheQuality = ({ set }: TheQualityProps) => (
  <View style={styles.whole}>
    <Text style={PLAYER_LOOK.styles.heading}>{set.heading}</Text>

    <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
      {set.choices.map((choice) => {
        const isChosen = choice.id === set.chosen;
        const ink = isChosen ? '#000000' : colours.text;

        return (
          <View key={choice.id} style={styles.tileSlot}>
            <Button
              tone="bare"
              isChosen={isChosen}
              isDisabled={choice.isDisabled === true}
              label={choice.label}
              onPress={() => {
                set.onChoose(choice.id);
              }}
            >
              <View
                style={[
                  styles.tile,
                  { backgroundColor: isChosen ? colours.chipChosen : colours.chip },
                  choice.isDisabled === true && styles.disabled,
                ]}
              >
                <Text style={[styles.label, { color: ink }]} numberOfLines={1}>
                  {choice.label}
                </Text>
                {(choice.detail ?? '').split(SAID_APART).map((line) =>
                  line === '' ? null : (
                    <Text
                      key={line}
                      style={[styles.detail, { color: isChosen ? '#000000' : colours.quiet }]}
                      numberOfLines={2}
                    >
                      {line}
                    </Text>
                  ),
                )}
              </View>
            </Button>
          </View>
        );
      })}
    </ScrollView>
  </View>
);

TheQuality.displayName = 'TheQuality';

export { TheQuality };
