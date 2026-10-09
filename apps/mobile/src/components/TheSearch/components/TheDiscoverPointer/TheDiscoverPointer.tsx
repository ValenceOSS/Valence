import { Search } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { useDiscoverSearch } from '@ValenceClient/requests/useDiscoverSearch';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheDiscoverPointerProps } from './TheDiscoverPointer.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, gap: 12, padding: 16 },
  said: { gap: 4 },
});

/**
 * Where a library search points to Discover for the films and programmes of the same name that are
 * not on the server, saying how many it has — or nothing, where it has none to ask for.
 *
 * @param asked - What was searched for.
 * @param onDiscover - Told to show what Discover found for the same words.
 */
const TheDiscoverPointer = ({ asked, onDiscover }: TheDiscoverPointerProps) => {
  const colours = useTheColours();
  const found = useDiscoverSearch(asked);
  const count = found.films.length + found.shows.length;

  if (count === 0) {
    return null;
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colours.surfaceRaised, borderColor: colours.border }]}
    >
      <View style={styles.said}>
        <Words size="heading">{say('screens.searchArea.discoverPointer.cantFindIt')}</Words>
        <Words tone="muted">
          {sayCount('screens.searchArea.discoverPointer.discoverHasCount', count, { query: asked })}
        </Words>
      </View>

      <Button
        tone="quiet"
        icon={Search}
        onPress={() => {
          onDiscover(asked);
        }}
      >
        {sayCount('screens.searchArea.discoverPointer.seeCountInDiscover', count)}
      </Button>
    </View>
  );
};

TheDiscoverPointer.displayName = 'TheDiscoverPointer';

export { TheDiscoverPointer };
