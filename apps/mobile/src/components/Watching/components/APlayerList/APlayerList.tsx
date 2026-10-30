import { Check } from '@keyline-icons/react-native/fill';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import type { APlayerListProps } from './APlayerList.types';

const styles = StyleSheet.create({
  detail: PLAYER_LOOK.styles.small,
  disabled: { opacity: 0.4 },
  list: { gap: 4, maxWidth: 560, paddingBottom: 24, paddingTop: 14 },
  row: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  said: { flex: 1, gap: 2 },
  whole: { flex: 1 },
});

/**
 * One column of choices under its heading: each named with its detail on a line beneath, the one
 * in force on a soft highlight with a tick at its end and the others in quieter type, scrolling on
 * its own when there are more than fit.
 *
 * @param set - The heading, the choices and which is chosen.
 * @param footer - Anything that follows the choices, such as how the chosen one is adjusted.
 */
const APlayerList = ({ set, footer }: APlayerListProps) => (
  <View style={styles.whole}>
    <Text style={PLAYER_LOOK.styles.heading}>{set.heading}</Text>

    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {set.choices.map((choice) => {
        const isChosen = choice.id === set.chosen;

        return (
          <Button
            key={choice.id}
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
                styles.row,
                isChosen && { backgroundColor: PLAYER_LOOK.colours.chip },
                choice.isDisabled === true && styles.disabled,
              ]}
            >
              <View style={styles.said}>
                <Text
                  style={isChosen ? PLAYER_LOOK.styles.labelChosen : PLAYER_LOOK.styles.label}
                  numberOfLines={1}
                >
                  {choice.label}
                </Text>

                {choice.detail === undefined ? null : (
                  <Text style={styles.detail} numberOfLines={2}>
                    {choice.detail}
                  </Text>
                )}
              </View>

              {isChosen ? <Icon of={Check} size={22} colour={PLAYER_LOOK.colours.text} /> : null}
            </View>
          </Button>
        );
      })}

      {footer}
    </ScrollView>
  </View>
);

APlayerList.displayName = 'APlayerList';

export { APlayerList };
