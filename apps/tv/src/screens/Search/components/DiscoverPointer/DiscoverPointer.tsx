import { Search } from '@keyline-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceTv/components/Button/Button';
import { tokens } from '@ValenceTv/theme/tokens';
import type { DiscoverPointerProps } from './DiscoverPointer.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Where a library search points to Discover for the films and shows of the same name that are not
 * on the server: what to do when it is not here, how many Discover has, and the way to them — said
 * as nothing on the server matching, where the library found nothing.
 *
 * @param asked - What was searched for.
 * @param count - How many Discover has to ask for.
 * @param isAlone - Whether the library found nothing, so this is all there is to show.
 * @param hasPreferredFocus - Whether it takes the focus as it appears, as it does on the way back
 *   from what Discover found.
 * @param onDiscover - Told to show what Discover found in place of what the library did.
 */
const DiscoverPointer = ({
  asked,
  count,
  isAlone,
  hasPreferredFocus,
  onDiscover,
}: DiscoverPointerProps) => (
  <View style={styles.card}>
    <View style={styles.said}>
      <Text style={styles.heading}>
        {isAlone
          ? say('screens.searchArea.discoverPointer.nothingOnThisServerMatches', { query: asked })
          : say('screens.searchArea.discoverPointer.cantFindIt')}
      </Text>
      <Text style={styles.detail}>
        {sayCount('screens.searchArea.discoverPointer.discoverHasCount', count, { query: asked })}
      </Text>
    </View>

    <Button
      label={sayCount('screens.searchArea.discoverPointer.seeCountInDiscover', count)}
      icon={Search}
      variant="secondary"
      hasPreferredFocus={hasPreferredFocus}
      onPress={onDiscover}
    />
  </View>
);

DiscoverPointer.displayName = 'DiscoverPointer';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: tokens.space.edge,
    padding: tokens.space.lg,
    gap: tokens.space.md,
    alignItems: 'flex-start',
    borderRadius: tokens.radii.xl,
    backgroundColor: tokens.colours.raised,
  },
  said: { gap: tokens.space.xs },
  heading: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '600' },
  detail: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { DiscoverPointer };
