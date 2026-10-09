import { ChevronLeft } from '@keyline-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceTv/components/Button/Button';
import { CatalogueShelf } from '@ValenceTv/components/CatalogueShelf/CatalogueShelf';
import { tokens } from '@ValenceTv/theme/tokens';
import type { DiscoverResultsProps } from './DiscoverResults.types';
import { say } from '@ValenceI18n/say';

/**
 * What Discover found for a library search's words — the films and shows of that name the server
 * does not have, a shelf each, to ask for — beneath a way back to what the library found, which
 * takes the focus as it appears.
 *
 * @param asked - What was searched for.
 * @param films - The films found.
 * @param shows - The shows found.
 * @param onAsk - Told which title was chosen, to look at and ask for.
 * @param onBack - Told to go back to what the library found.
 */
const DiscoverResults = ({ asked, films, shows, onAsk, onBack }: DiscoverResultsProps) => (
  <>
    <View style={styles.head}>
      <Button
        label={say('common.backToLibraryResults')}
        icon={ChevronLeft}
        variant="ghost"
        hasPreferredFocus
        onPress={onBack}
      />
      <Text style={styles.heading}>
        {say('screens.requestsPage.resultsForQuery', { query: asked })}
      </Text>
    </View>

    {films.length === 0 ? null : (
      <CatalogueShelf title={say('common.films')} titles={films} onOpen={onAsk} />
    )}

    {shows.length === 0 ? null : (
      <CatalogueShelf title={say('common.shows')} titles={shows} onOpen={onAsk} />
    )}
  </>
);

DiscoverResults.displayName = 'DiscoverResults';

const styles = StyleSheet.create({
  head: { paddingHorizontal: tokens.space.edge, gap: tokens.space.md, alignItems: 'flex-start' },
  heading: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '600' },
});

export { DiscoverResults };
