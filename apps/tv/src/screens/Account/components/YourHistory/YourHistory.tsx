import { FlatList, StyleSheet, Text, View } from 'react-native';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { HistoryCard } from '@ValenceTv/screens/Account/components/HistoryCard/HistoryCard';
import { useInfiniteQuery } from '@tanstack/react-query';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { tokens } from '@ValenceTv/theme/tokens';
import type { YourHistoryProps } from './YourHistory.types';
import { say } from '@ValenceI18n/say';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';

const AT_MOST = 10;

/**
 * What this viewer has watched lately, newest first, on their account page, as a shelf of wide
 * cards each opening the film or the programme it was — for finding again something watched last
 * week from the sofa. The card the remote rests on lights the page. Forgetting
 * history is left to the phone and the browser, where it is asked about properly. Nothing is drawn
 * where nothing has been watched. The list catches the remote across the whole width of the page.
 *
 * @param onOpen - Told which film or programme a chosen viewing was.
 * @param onFocus - Told when the remote comes onto the list.
 * @param onLight - Told the picture of the title the remote has come to rest on, to light the page.
 */
const YourHistory = ({ onOpen, onFocus, onLight }: YourHistoryProps) => {
  const history = useInfiniteQuery(viewingQueries.history());
  const viewings = (history.data?.pages.flat() ?? []).slice(0, AT_MOST);

  if (viewings.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{say('common.watchHistory')}</Text>

      <FocusGuide isRemembering>
        <FlatList
          horizontal
          data={viewings}
          keyExtractor={(viewing) => viewing.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inside}
          style={styles.row}
          renderItem={({ item }) => (
            <HistoryCard
              viewing={item}
              onFocus={(viewing) => {
                onFocus();
                onLight(
                  artworkUrl(viewing.mediaItemId, 'backdrop', {
                    isOfTitle: true,
                    size: 'medium',
                  }),
                );
              }}
              onPress={(viewing) => {
                onOpen({
                  kind: viewing.seriesTitle === null ? 'film' : 'show',
                  mediaId: viewing.mediaItemId,
                  seriesId: viewing.seriesId,
                });
              }}
            />
          )}
        />
      </FocusGuide>
    </View>
  );
};

YourHistory.displayName = 'YourHistory';

const styles = StyleSheet.create({
  section: { alignSelf: 'stretch', gap: tokens.space.xs, marginTop: tokens.space.lg },
  heading: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingLeft: tokens.space.md,
  },
  row: { overflow: 'hidden' },
  inside: { gap: tokens.space.md, padding: tokens.space.md },
});

export { YourHistory };
