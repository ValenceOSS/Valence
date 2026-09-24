import { Check, X } from '@keyline-icons/react-native/fill';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { FONTS } from '@ValencePhone/theme/FONTS';
import type { TheChoicesProps } from './TheChoices.types';

const OVER_THE_PICTURE = '#ffffff';

const QUIETLY = 'rgba(255, 255, 255, 0.6)';

const PANEL = 'rgba(12, 12, 12, 0.96)';

const EDGE = 24;

const styles = StyleSheet.create({
  behind: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  chosenRow: { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  detail: { color: QUIETLY, fontFamily: FONTS.sans.semibold, fontSize: 12 },
  heading: {
    color: QUIETLY,
    fontSize: 12,
    fontFamily: FONTS.sans.bold,
    letterSpacing: 0.8,
    paddingBottom: 6,
    textTransform: 'uppercase',
  },
  inside: { gap: 22, paddingBottom: EDGE },
  label: { color: OVER_THE_PICTURE, flex: 1, fontFamily: FONTS.sans.semibold, fontSize: 15 },
  panel: {
    backgroundColor: PANEL,
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 300,
  },
  row: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  top: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  topWord: { color: OVER_THE_PICTURE, fontSize: 17, fontFamily: FONTS.sans.semibold },
});

/**
 * The rest of the player, kept off the picture.
 *
 * Everything a viewer might want but would have to think about first lives here: what language to
 * hear it in, and how much of their connection to spend on it. Each is a short list with a mark
 * against the one in force, rather than a control that has to be understood before it can be used.
 *
 * It comes in from the side rather than up from the bottom, because this screen is sideways and a
 * sheet rising into a landscape phone covers the film it is asking about.
 *
 * @param sets - What there is to choose, in the order it should be read.
 * @param onClose - Told they are done choosing.
 */
const TheChoices = ({ sets, onClose }: TheChoicesProps) => {
  const room = useSafeAreaInsets();

  return (
    <View style={styles.behind}>
      <Button tone="bare" label="Close the settings" onPress={onClose}>
        <View style={styles.behind} />
      </Button>

      <View style={[styles.panel, { paddingRight: Math.max(room.right, EDGE) }]}>
        <ScrollView
          contentContainerStyle={[styles.inside, { paddingLeft: EDGE, paddingTop: room.top + 18 }]}
        >
          <View style={styles.top}>
            <Text style={styles.topWord}>Settings</Text>

            <Button tone="bare" label="Close the settings" onPress={onClose}>
              <Icon of={X} size={22} colour={OVER_THE_PICTURE} />
            </Button>
          </View>

          {sets.map((set) => (
            <View key={set.heading}>
              <Text style={styles.heading}>{set.heading}</Text>

              {set.choices.map((choice) => (
                <Button
                  key={choice.id}
                  tone="bare"
                  isChosen={choice.id === set.chosen}
                  label={choice.label}
                  onPress={() => {
                    set.onChoose(choice.id);
                  }}
                >
                  <View style={[styles.row, choice.id === set.chosen && styles.chosenRow]}>
                    <Text style={styles.label} numberOfLines={1}>
                      {choice.label}
                    </Text>

                    {choice.detail === undefined ? null : (
                      <Text style={styles.detail}>{choice.detail}</Text>
                    )}

                    {choice.id === set.chosen ? (
                      <Icon of={Check} size={18} colour={OVER_THE_PICTURE} />
                    ) : null}
                  </View>
                </Button>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

TheChoices.displayName = 'TheChoices';

export { TheChoices };
