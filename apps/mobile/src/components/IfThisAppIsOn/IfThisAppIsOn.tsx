import { StyleSheet, View } from 'react-native';
import { useThisAppIsTurnedOff } from '@ValenceClient/about/useThisAppIsTurnedOff';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { IfThisAppIsOnProps } from './IfThisAppIsOn.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  whole: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center', padding: 32 },
});

/**
 * The phone app, unless the server's administrator has turned it off, when it says so instead and
 * offers another server — Valence still works in a browser, which cannot be turned off.
 *
 * @param children - The app, for a server that lets it in.
 * @param onElsewhere - Told somebody wants a different server.
 */
const IfThisAppIsOn = ({ children, onElsewhere }: IfThisAppIsOnProps) => {
  const isTurnedOff = useThisAppIsTurnedOff();
  const colours = useTheColours();

  if (!isTurnedOff) {
    return children;
  }

  return (
    <View style={[styles.whole, { backgroundColor: colours.surface }]}>
      <Words size="title" isCentred>
        {say('common.thisAppIsTurnedOffHere')}
      </Words>
      <Words tone="muted" isCentred>
        {say('common.whoeverRunsThisServerHasTurned')}
      </Words>
      <Button tone="quiet" onPress={onElsewhere}>
        {say('common.useADifferentServer')}
      </Button>
    </View>
  );
};

IfThisAppIsOn.displayName = 'IfThisAppIsOn';

export { IfThisAppIsOn };
