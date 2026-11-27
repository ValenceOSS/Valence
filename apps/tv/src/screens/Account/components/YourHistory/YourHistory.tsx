import { FlatList, StyleSheet, Text, View } from 'react-native';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { HistoryCard } from '@ValenceTv/components/HistoryCard/HistoryCard';
import { groupHistory } from '@ValenceClient/history/groupHistory';
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
 * week from the sofa. A programme stands once, at the episode watched last. The card the remote
 * rests on lights the page. Everything else to do with the history is on its own page in the bar.
 * Nothing is drawn where nothing has been watched. The list catches the remote across the whole
 * width of the page.
 *
 * @param onOpen - Told which film or programme a chosen viewing was.
 * @param onFocus - Told when the remote comes onto the list.
 * @param onLight - Told the picture of the title the remote has come to rest on, to light the page.
 */
const YourHistory = ({ onOpen, onFocus, onLight }: YourHistoryProps) => {
  const history = useInfiniteQuery(viewingQueries.history());
  const watched = groupHistory(history.data?.pages.flat() ?? []).slice(0, AT_MOST);

  if (watched.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{say('common.watchHistory')}</Text>

      <FocusGuide isRemembering>
        <FlatList
          horizontal
          data={watched}
          keyExtractor={(title) => title.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.inside}
          style={styles.row}
          renderItem={({ item }) => (
            <HistoryCard
              watched={item}
              onFocus={({ latest }) => {
                onFocus();
                onLight(
                  artworkUrl(latest.mediaItemId, 'backdrop', {
                    isOfTitle: true,
                    size: 'medium',
                  }),
                );
              }}
              onPress={({ latest }) => {
                onOpen({
                  kind: latest.seriesTitle === null ? 'film' : 'show',
                  mediaId: latest.mediaItemId,
                  seriesId: latest.seriesId,
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
