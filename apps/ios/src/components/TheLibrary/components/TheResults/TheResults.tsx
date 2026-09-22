import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { theArtworkFor } from '@ValencePhone/components/APoster/theArtworkFor';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { whatAResultOpens } from '@ValencePhone/components/TheLibrary/components/TheResults/whatAResultOpens';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheResultsProps } from './TheResults.types';

const AS_MANY_AS_ARE_WORTH_SHOWING = 60;

const styles = StyleSheet.create({
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
});

/**
 * What a search found, across every library a phone can play.
 *
 * Asked of all of them at once rather than of the tab that happened to be showing, because
 * somebody searching for a film does not know or care which library it is in. A programme turns up
 * once however many of its episodes matched, and opens as the programme.
 *
 * @param asked - What was searched for.
 * @param libraryIds - Where to look.
 * @param howFarThrough - How much of each they have seen, as a fraction.
 * @param onLookAt - Told which film they want.
 * @param onLookAtShow - Told which programme they want, in which library.
 */
const TheResults = ({
  asked,
  libraryIds,
  howFarThrough,
  onLookAt,
  onLookAtShow,
}: TheResultsProps) => {
  const colours = useTheColours();
  const found = useQuery(
    libraryQueries.across(libraryIds, { search: asked, limit: AS_MANY_AS_ARE_WORTH_SHOWING }),
  );

  if (found.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  const results = collapseToShows(found.data ?? []);

  if (results.length === 0) {
    return <Words tone="muted">{`Nothing called “${asked}”.`}</Words>;
  }

  return (
    <View style={styles.shelf}>
      {results.map((media) => {
        const opens = whatAResultOpens(media);
        const called =
          opens.kind === 'programme' ? (media.seriesTitle ?? media.title) : media.title;

        return (
          <Button
            key={media.id}
            tone="bare"
            label={called}
            onPress={() => {
              if (opens.kind === 'programme') {
                onLookAtShow(opens.libraryId, opens.showId);
              } else {
                onLookAt(opens.mediaId);
              }
            }}
          >
            <APoster
              title={called}
              year={opens.kind === 'programme' ? null : media.year}
              artwork={theArtworkFor(media)}
              watched={opens.kind === 'programme' ? 0 : howFarThrough(media.id)}
            />
          </Button>
        );
      })}
    </View>
  );
};

TheResults.displayName = 'TheResults';

export { TheResults };
