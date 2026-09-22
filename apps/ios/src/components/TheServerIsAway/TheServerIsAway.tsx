import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheServer } from '@ValencePhone/hooks/useTheServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';

const styles = StyleSheet.create({
  note: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 4,
  },
  place: { alignItems: 'center', left: 16, position: 'absolute', right: 16 },
  words: { flexShrink: 1, gap: 2, paddingVertical: 10 },
});

/**
 * A note floating over whatever is showing while the server has gone quiet: that it has, that the
 * app is trying again on its own, and a way to try now. What was already on the screen stays.
 */
const TheServerIsAway = () => {
  const colours = useTheColours();
  const room = useSafeAreaInsets();
  const { address, isAway, tryNow } = useTheServer();

  if (!isAway) {
    return null;
  }

  return (
    <View style={[styles.place, { top: room.top + 4 }]} pointerEvents="box-none">
      <View
        style={[
          styles.note,
          { backgroundColor: colours.surfaceRaised, borderColor: colours.border },
        ]}
      >
        <View style={styles.words}>
          <Words size="small">{`Can’t reach ${address ?? 'your server'}`}</Words>
          <Words size="small" tone="muted">
            Trying again every few seconds.
          </Words>
        </View>

        <Button tone="quiet" onPress={tryNow}>
          Try now
        </Button>
      </View>
    </View>
  );
};

TheServerIsAway.displayName = 'TheServerIsAway';

export { TheServerIsAway };
