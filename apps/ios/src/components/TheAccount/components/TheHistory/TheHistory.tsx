import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { describeWhen } from '@ValenceClient/history/describeWhen';
import { forgetHistory, forgetViewing } from '@ValenceClient/history/fetchHistory';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';

const styles = StyleSheet.create({
  forget: { padding: 10 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  words: { flex: 1, gap: 2 },
});

/**
 * What this viewer has watched, newest first, a page at a time, with a way to forget any one of it
 * or all of it — the last asked first, since it cannot be undone.
 */
const TheHistory = () => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const history = useInfiniteQuery(viewingQueries.history());
  const viewings = history.data?.pages.flat() ?? [];
  const now = new Date();

  const reread = () => cache.invalidateQueries({ queryKey: viewingQueries.history().queryKey });

  const forgetEverything = () => {
    Alert.alert(
      'Forget everything you have watched?',
      'Your history is cleared. Where you are in each title is kept.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Forget everything',
          style: 'destructive',
          onPress: () => {
            void forgetHistory().then(reread);
          },
        },
      ],
    );
  };

  if (history.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  if (history.isError) {
    return <Words tone="danger">Your history could not be read.</Words>;
  }

  if (viewings.length === 0) {
    return <Words tone="muted">Nothing watched yet.</Words>;
  }

  return (
    <>
      {viewings.map((viewing) => {
        const name =
          viewing.seriesTitle === null
            ? (viewing.title ?? 'Something')
            : `${viewing.seriesTitle} — ${viewing.title ?? ''}`;

        return (
          <View key={viewing.id} style={styles.row}>
            <View style={styles.words}>
              <Words lines={2}>{name}</Words>
              <Words size="small" tone="muted">
                {[
                  describeWhen(new Date(viewing.lastWatchedAt), now),
                  `${formatDuration(viewing.secondsWatched)} watched`,
                  viewing.isFinished ? 'Finished' : null,
                ]
                  .filter((part) => part !== null)
                  .join(' · ')}
              </Words>
            </View>

            <Button
              tone="bare"
              label={`Forget ${name}`}
              onPress={() => {
                void forgetViewing(viewing.id).then(reread);
              }}
            >
              <View style={styles.forget}>
                <Icon of={Trash2} size={18} colour={colours.textMuted} />
              </View>
            </Button>
          </View>
        );
      })}

      {history.hasNextPage ? (
        <Button
          tone="quiet"
          isBusy={history.isFetchingNextPage}
          onPress={() => {
            void history.fetchNextPage();
          }}
        >
          Show more
        </Button>
      ) : (
        <Words size="small" tone="muted">
          Viewings are forgotten automatically after a year.
        </Words>
      )}

      <Button tone="quiet" onPress={forgetEverything}>
        Forget everything
      </Button>
    </>
  );
};

TheHistory.displayName = 'TheHistory';

export { TheHistory };
