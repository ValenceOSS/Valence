import { Check } from '@keyline-icons/react-native/fill';
import { memo } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { SIDE_PANEL } from '@ValenceMobile/components/Watching/SIDE_PANEL';
import { TheSidePanel } from '@ValenceMobile/components/Watching/components/TheSidePanel/TheSidePanel';
import type { TheChoicesProps } from './TheChoices.types';
import { say } from '@ValenceI18n/say';

const styles = SIDE_PANEL.styles;

/**
 * The rest of the player, kept off the picture.
 *
 * Everything a viewer might want but would have to think about first lives here: what language to
 * hear it in, and how much of their connection to spend on it. Each is a short list with a mark
 * against the one in force, rather than a control that has to be understood before it can be used.
 *
 * @param sets - What there is to choose, in the order it should be read.
 * @param onClose - Told they are done choosing.
 */
const TheChoicesPanel = ({ sets, onClose }: TheChoicesProps) => (
  <TheSidePanel
    title={say('common.settings')}
    closeLabel={say('phone.watching.theChoices.closeTheSettings')}
    onClose={onClose}
  >
    {sets.map((set) => (
      <View key={set.heading}>
        <Text style={styles.heading}>{set.heading}</Text>

        {set.choices.map((choice) => (
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

              {choice.detail === undefined ? null : (
                <Text style={styles.detail}>{choice.detail}</Text>
              )}

              {choice.id === set.chosen ? (
                <Icon of={Check} size={18} colour={SIDE_PANEL.colours.text} />
              ) : null}
            </View>
          </Button>
        ))}
      </View>
    ))}
  </TheSidePanel>
);

const TheChoices = memo(TheChoicesPanel);

TheChoices.displayName = 'TheChoices';

export { TheChoices };
