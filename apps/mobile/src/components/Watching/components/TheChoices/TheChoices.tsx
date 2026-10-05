import { Check } from '@keyline-icons/react-native/fill';
import { ChevronLeft, ChevronRight } from '@keyline-icons/react-native';
import { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { SIDE_PANEL } from '@ValenceMobile/components/ASidePanel/SIDE_PANEL';
import { ASidePanel } from '@ValenceMobile/components/ASidePanel/ASidePanel';
import type { ASetOfChoices, TheChoicesProps } from './TheChoices.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  ...SIDE_PANEL.styles,
  back: { alignItems: 'center', flexDirection: 'row', gap: 4, paddingBottom: 8 },
  menu: { gap: 2 },
  menuLabel: { flex: 1, gap: 2 },
  now: { color: SIDE_PANEL.colours.quiet, fontSize: 13 },
});

/**
 * One setting's choices, with a mark against the one in force.
 *
 * @param set - The setting.
 * @returns Its rows.
 */
const theRowsOf = (set: ASetOfChoices) =>
  set.choices.map((choice) => (
    <Button
      key={choice.id}
      tone="bare"
      isChosen={choice.id === set.chosen}
      isDisabled={choice.isDisabled === true}
      label={choice.label}
      onPress={() => {
        set.onChoose(choice.id);
      }}
    >
      <View
        style={[
          styles.row,
          choice.id === set.chosen && styles.chosenRow,
          choice.isDisabled === true && styles.disabledRow,
        ]}
      >
        <Text style={styles.label} numberOfLines={1}>
          {choice.label}
        </Text>

        {choice.detail === undefined ? null : <Text style={styles.detail}>{choice.detail}</Text>}

        {choice.id === set.chosen ? (
          <Icon of={Check} size={18} colour={SIDE_PANEL.colours.text} />
        ) : null}
      </View>
    </Button>
  ));

/**
 * The rest of the player, kept off the picture.
 *
 * It opens on a short menu, one row for each setting with the choice in force beside it, the way the
 * phone's own player settings read, and a row opens that setting's list on its own, with a way back
 * to the menu. A single setting, such as one season's episodes, opens straight onto its list.
 *
 * @param sets - What there is to choose, in the order it should be read.
 * @param onClose - Told they are done choosing.
 */
const TheChoicesPanel = ({ sets, onClose }: TheChoicesProps) => {
  const [open, setOpen] = useState<string | null>(null);
  const only = sets.length === 1 ? sets[0] : undefined;
  const shown = only ?? sets.find((set) => set.heading === open);

  return (
    <ASidePanel
      title={shown?.heading ?? say('common.settings')}
      closeLabel={say('phone.watching.theChoices.closeTheSettings')}
      onClose={onClose}
    >
      {shown !== undefined ? (
        <View>
          {only !== undefined ? null : (
            <Button
              tone="bare"
              label={say('common.back')}
              onPress={() => {
                setOpen(null);
              }}
            >
              <View style={styles.back}>
                <Icon of={ChevronLeft} size={18} colour={SIDE_PANEL.colours.quiet} />
                <Text style={styles.detail}>{say('common.settings')}</Text>
              </View>
            </Button>
          )}

          {theRowsOf(shown)}
        </View>
      ) : (
        <View style={styles.menu}>
          {sets.map((set) => (
            <Button
              key={set.heading}
              tone="bare"
              label={set.heading}
              onPress={() => {
                setOpen(set.heading);
              }}
            >
              <View style={styles.row}>
                <View style={styles.menuLabel}>
                  <Text style={styles.label} numberOfLines={1}>
                    {set.heading}
                  </Text>
                  <Text style={styles.now} numberOfLines={1}>
                    {set.choices.find((choice) => choice.id === set.chosen)?.label ?? ''}
                  </Text>
                </View>
                <Icon of={ChevronRight} size={18} colour={SIDE_PANEL.colours.quiet} />
              </View>
            </Button>
          ))}
        </View>
      )}
    </ASidePanel>
  );
};

const TheChoices = memo(TheChoicesPanel);

TheChoices.displayName = 'TheChoices';

export { TheChoices };
