import { StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { describeWhen } from '@ValenceClient/history/describeWhen';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { Button } from '@ValenceTv/components/Button/Button';
import { tokens } from '@ValenceTv/theme/tokens';
import type { Viewing } from '@ValenceContracts/schemas/Viewing';
import type { YourHistoryProps } from './YourHistory.types';
import { say } from '@ValenceI18n/say';

const AT_MOST = 10;

/**
 * Names a viewing as the phone's history does: the film, or the programme and its episode.
 *
 * @param viewing - The viewing.
 */
const nameOf = (viewing: Viewing): string =>
  viewing.seriesTitle === null
    ? (viewing.title ?? say('common.something'))
    : `${viewing.seriesTitle} — ${viewing.title ?? ''}`;

/**
 * What this viewer has watched lately, newest first, on their account page, each opening the film
 * or the programme it was — for finding again something watched last week from the sofa. Forgetting
 * history is left to the phone and the browser, where it is asked about properly. Nothing is drawn
 * where nothing has been watched. The list catches the remote across the whole width of the page.
 *
 * @param onOpen - Told which film or programme a chosen viewing was.
 * @param onFocus - Told when the remote comes onto the list.
 */
const YourHistory = ({ onOpen, onFocus }: YourHistoryProps) => {
  const history = useInfiniteQuery(viewingQueries.history());
  const viewings = (history.data?.pages.flat() ?? []).slice(0, AT_MOST);

  if (viewings.length === 0) {
    return null;
  }

  const now = new Date();

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{say('common.watchHistory')}</Text>

      <TVFocusGuideView autoFocus style={styles.list}>
        {viewings.map((viewing) => (
          <Button
            key={viewing.id}
            label={nameOf(viewing)}
            detail={[
              describeWhen(new Date(viewing.lastWatchedAt), now),
              viewing.isFinished ? say('common.finished') : null,
            ]
              .filter((part) => part !== null)
              .join(' · ')}
            variant="ghost"
            isWide
            onFocus={onFocus}
            onPress={() => {
              onOpen({
                kind: viewing.seriesTitle === null ? 'film' : 'show',
                mediaId: viewing.mediaItemId,
              });
            }}
          />
        ))}
      </TVFocusGuideView>
    </View>
  );
};

YourHistory.displayName = 'YourHistory';

const styles = StyleSheet.create({
  section: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: tokens.space.xs,
    marginTop: tokens.space.lg,
  },
  heading: {
    alignSelf: 'stretch',
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.edge,
  },
  list: { width: 760, gap: tokens.space.md, alignItems: 'center' },
});

export { YourHistory };
