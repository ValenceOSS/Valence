import { Check } from '@keyline-icons/react-native/fill';
import { StyleSheet, View } from 'react-native';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheTelevisionsChoicesProps } from './TheTelevisionsChoices.types';

const TICK = 20;

const styles = StyleSheet.create({
  groups: { gap: 18, paddingBottom: 8 },
  quieter: { opacity: 0.45 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  said: { flex: 1, gap: 2 },
});

/**
 * Some of a television's settings in a sheet rising from the foot — the sound and the subtitles
 * together, or the quality, or the speed — each on a grouped card as the phone's own settings draw
 * them, under its name where the sheet holds more than one: a row for each choice the television
 * offers, what it costs beneath it, and a tick against the one in force. Choosing one tells the
 * television and puts the sheet away.
 *
 * @param title - What the sheet is called.
 * @param sets - The settings it holds, each with what there is to choose and how to choose it.
 * @param isOpen - Whether it is out.
 * @param onClose - Told to put it away.
 */
const TheTelevisionsChoices = ({ title, sets, isOpen, onClose }: TheTelevisionsChoicesProps) => {
  const colours = useTheColours();

  return (
    <ASheet isOpen={isOpen} title={title} onClose={onClose}>
      <View style={styles.groups}>
        {sets.map((set) => (
          <AGroup key={set.heading} {...(sets.length > 1 ? { title: set.heading } : {})}>
            {set.choices.map((choice) => {
              const isChosen = choice.id === set.chosen;

              return (
                <Button
                  key={choice.id}
                  tone="bare"
                  label={choice.label}
                  isChosen={isChosen}
                  isDisabled={choice.isDisabled === true}
                  onPress={() => {
                    set.onChoose(choice.id);
                    onClose();
                  }}
                >
                  <View style={[styles.row, choice.isDisabled === true && styles.quieter]}>
                    <View style={styles.said}>
                      <Words lines={1}>{choice.label}</Words>
                      {choice.detail === undefined ? null : (
                        <Words size="small" tone="muted" lines={1}>
                          {choice.detail}
                        </Words>
                      )}
                    </View>
                    {isChosen ? <Icon of={Check} size={TICK} colour={colours.accent} /> : null}
                  </View>
                </Button>
              );
            })}
          </AGroup>
        ))}
      </View>
    </ASheet>
  );
};

TheTelevisionsChoices.displayName = 'TheTelevisionsChoices';

export { TheTelevisionsChoices };
