import { Check } from '@keyline-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AManyChoicesProps } from './AManyChoices.types';

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontFamily: FONTS.sans.semibold, fontSize: 14 },
  whole: { gap: 8 },
});

/**
 * Choices any number of which can be taken at once — the formats a book is wanted in, the kinds of
 * release followed from an artist — as chips that tick on and off.
 *
 * @param label - What is being chosen.
 * @param choices - What there is to choose.
 * @param chosen - What is chosen, in the order of the choices.
 * @param onChange - Told what is chosen now.
 */
const AManyChoices = ({ label, choices, chosen, onChange }: AManyChoicesProps) => {
  const colours = useTheColours();

  return (
    <View style={styles.whole} accessibilityLabel={label}>
      <Words size="small" tone="muted">
        {label}
      </Words>

      <View style={styles.chips}>
        {choices.map((choice) => {
          const isOn = chosen.includes(choice.id);

          return (
            <Button
              key={choice.id}
              tone="bare"
              isChosen={isOn}
              label={choice.label}
              onPress={() => {
                onChange(
                  choices
                    .map((one) => one.id)
                    .filter((id) => (id === choice.id ? !isOn : chosen.includes(id))),
                );
              }}
            >
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: isOn ? colours.accent : 'transparent',
                    borderColor: isOn ? colours.accent : colours.border,
                  },
                ]}
              >
                {isOn ? <Icon of={Check} size={14} colour={colours.accentContrast} /> : null}
                <Text
                  style={[styles.label, { color: isOn ? colours.accentContrast : colours.text }]}
                >
                  {choice.label}
                </Text>
              </View>
            </Button>
          );
        })}
      </View>
    </View>
  );
};

AManyChoices.displayName = 'AManyChoices';

export { AManyChoices };
