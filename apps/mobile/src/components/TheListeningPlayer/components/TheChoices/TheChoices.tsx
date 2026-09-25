import { Check } from '@keyline-icons/react-native/fill';
import { StyleSheet, View } from 'react-native';
import { chooseListening } from '@ValenceClient/books/chooseListening';
import { listeningChoices } from '@ValenceClient/books/listeningChoices';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheBook } from '@ValenceMobile/hooks/useTheBook';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { say } from '@ValenceI18n/say';
import type { ListeningPanel } from '@ValenceClient/books/listeningChoices';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { TheChoicesProps } from './TheChoices.types';

const TICK = 20;

const TITLES: Record<ListeningPanel, StringKey> = {
  speed: 'phone.theChoices.speed',
  sleep: 'phone.theChoices.sleepTimer',
  chapters: 'phone.theChoices.chapters',
};

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
  tick: { width: TICK },
  title: { flex: 1 },
});

/**
 * One of the audiobook player's lists, in a sheet — how fast it plays, when a sleep timer stops it,
 * or every chapter with how long each lasts — with a tick beside the one chosen now. Choosing one
 * does it and puts the sheet away.
 *
 * @param panel - Which list is out, or nothing while none is.
 * @param onClose - Told to put it away.
 */
const TheChoices = ({ panel, onClose }: TheChoicesProps) => {
  const colours = useTheColours();
  const { player, state } = useTheBook({ followsPosition: panel === 'chapters' });

  return (
    <ASheet
      isOpen={panel !== null}
      title={panel === null ? '' : say(TITLES[panel])}
      onClose={onClose}
    >
      {panel === null
        ? null
        : listeningChoices(panel, state).map((choice) => (
            <Button
              key={choice.id}
              tone="bare"
              label={choice.label}
              isChosen={choice.isCurrent}
              onPress={() => {
                chooseListening(player, panel, choice.id);
                onClose();
              }}
            >
              <View style={styles.row}>
                <View style={styles.tick}>
                  {choice.isCurrent ? <Icon of={Check} size={TICK} colour={colours.text} /> : null}
                </View>
                <View style={styles.title}>
                  <Words lines={1}>{choice.label}</Words>
                </View>
                {choice.detail === undefined ? null : (
                  <Words size="small" tone="muted">
                    {choice.detail}
                  </Words>
                )}
              </View>
            </Button>
          ))}
    </ASheet>
  );
};

TheChoices.displayName = 'TheChoices';

export { TheChoices };
