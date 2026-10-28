import { ChevronLeft } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { describeCatalogueSearch } from '@ValenceClient/requests/describeCatalogueSearch';
import { useDiscoverSearch } from '@ValenceClient/requests/useDiscoverSearch';
import { ACatalogueCard } from '@ValenceMobile/components/ACatalogueCard/ACatalogueCard';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheDiscoverResultsProps } from './TheDiscoverResults.types';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const styles = StyleSheet.create({
  head: { alignItems: 'flex-start', gap: 8 },
});

/**
 * What Discover found for a library search's words — the films and programmes of that name the
 * server does not have, a shelf each, to ask for — with a way back to what the library found.
 *
 * @param asked - What was searched for.
 * @param onAsk - Told which title somebody wants to see.
 * @param onBack - Told to go back to what the library found.
 * @param onSeeAll - Told somebody wants everything the search found of films or of shows, past what
 *   fits a shelf, where the server can read further than that.
 */
const TheDiscoverResults = ({ asked, onAsk, onBack, onSeeAll }: TheDiscoverResultsProps) => {
  const colours = useTheColours();
  const found = useDiscoverSearch(asked);
  const readsOn = useServerHas('requests.searchPages') === true;
  const shelves = [
    {
      id: 'films',
      title: say('common.films'),
      titles: found.films,
      searching: { kind: 'film', query: asked } as const,
    },
    {
      id: 'shows',
      title: say('common.shows'),
      titles: found.shows,
      searching: { kind: 'series', query: asked } as const,
    },
    { id: 'artists', title: say('common.artists'), titles: found.artists, searching: null },
    { id: 'books', title: say('common.books'), titles: found.books, searching: null },
  ].filter((shelf) => shelf.titles.length > 0);

  return (
    <>
      <View style={styles.head}>
        <Button tone="quiet" icon={ChevronLeft} onPress={onBack}>
          {say('common.backToLibraryResults')}
        </Button>
        <Words size="heading">
          {say('screens.requestsPage.resultsForQuery', { query: asked })}
        </Words>
      </View>

      {found.isPending ? (
        <ASpinner colour={colours.textMuted} />
      ) : shelves.length === 0 ? (
        <Words tone="muted">
          {found.problem ??
            say('screens.requestsPage.nothingInTheCataloguesMatches', { query: asked })}
        </Words>
      ) : (
        shelves.map((shelf) => (
          <AShelf
            key={shelf.id}
            title={shelf.title}
            {...(onSeeAll === undefined || !readsOn || shelf.searching === null
              ? {}
              : {
                  onSeeAll: () => {
                    onSeeAll(shelf.searching, describeCatalogueSearch(shelf.searching));
                  },
                })}
          >
            {shelf.titles.map((title) => (
              <ACatalogueCard key={`${title.kind}:${title.id}`} title={title} onAsk={onAsk} />
            ))}
          </AShelf>
        ))
      )}
    </>
  );
};

TheDiscoverResults.displayName = 'TheDiscoverResults';

export { TheDiscoverResults };
