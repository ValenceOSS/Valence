import { Check } from '@keyline-icons/react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import type { APlayerListProps } from './APlayerList.types';

const styles = StyleSheet.create({
  check: { width: 34 },
  detail: { ...PLAYER_LOOK.styles.small, marginLeft: 8 },
  disabled: { opacity: 0.4 },
  list: { paddingBottom: 24, paddingTop: 18 },
  row: { alignItems: 'center', flexDirection: 'row', paddingVertical: 12 },
  whole: { flex: 1 },
});

/**
 * One column of choices under its heading, with a tick against the one in force and the others in
 * quieter type, scrolling on its own when there are more than fit.
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
            <View style={[styles.row, choice.isDisabled === true && styles.disabled]}>
              <View style={styles.check}>
                {isChosen ? <Icon of={Check} size={24} colour={PLAYER_LOOK.colours.text} /> : null}
              </View>

              <Text
                style={isChosen ? PLAYER_LOOK.styles.labelChosen : PLAYER_LOOK.styles.label}
                numberOfLines={1}
              >
                {choice.label}
              </Text>

              {choice.detail === undefined ? null : (
                <Text style={styles.detail} numberOfLines={1}>
                  {choice.detail}
                </Text>
              )}
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
