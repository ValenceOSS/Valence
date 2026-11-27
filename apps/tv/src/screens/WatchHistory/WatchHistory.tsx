import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Bin } from '@keyline-icons/react-native';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { forgetHistory } from '@ValenceClient/history/fetchHistory';
import { forgetTitleInPlace } from '@ValenceClient/history/forgetTitleInPlace';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { groupHistory } from '@ValenceClient/history/groupHistory';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { Button } from '@ValenceTv/components/Button/Button';
import { HistoryCard } from '@ValenceTv/components/HistoryCard/HistoryCard';
import { useRoomToFill } from '@ValenceTv/layout/useRoomToFill';
import { useProgress } from '@ValenceTv/library/useProgress';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { useTheScreen } from '@ValenceTv/platform/useTheScreen';
import { HistoryChoices } from '@ValenceTv/screens/WatchHistory/components/HistoryChoices/HistoryChoices';
import { tokens } from '@ValenceTv/theme/tokens';
import type { WatchedTitle } from '@ValenceClient/history/groupHistory';
import type { WatchHistoryProps } from './WatchHistory.types';
import { say } from '@ValenceI18n/say';

const ACROSS = 3;

/**
 * The picture a title in the history lights the page with: the programme's own for an episode.
 *
 * @param watched - The film or programme.
 * @returns Where its backdrop is served.
 */
const moodOf = (watched: WatchedTitle): string =>
  artworkUrl(watched.latest.mediaItemId, 'backdrop', { isOfTitle: true, size: 'medium' });

/**
 * Everything this viewer has watched, newest first, as a wall of wide cards three across, one to
 * each film or programme — a programme stands once, at the episode watched last, saying how far
 * through it they got. Choosing a card opens what can be done with it: resume it, play the next
 * episode, play it from the beginning, go to its page, or take it off the history. Above the wall,
 * the whole history can be cleared, which asks first and keeps where they got to in everything.
 * Older viewings are read as the remote nears the foot of the wall. The page is lit by the title the
 * remote rests on, and by what was watched last until it rests on one.
 *
 * @param onOpen - Told which film or programme's page to open.
 * @param onPlay - Told what to play, and from where.
 * @param onMood - Told the picture to light the page with, or nothing for the plain ground.
 * @param upTo - The tab this page belongs under, which pressing up from the top goes to.
 */
const WatchHistoryPage = ({ onOpen, onPlay, onMood, upTo }: WatchHistoryProps) => {
  const cache = useQueryClient();
  const history = useInfiniteQuery(viewingQueries.history());
  const { progress } = useProgress();
  const [chosen, setChosen] = useState<WatchedTitle | null>(null);
  const canForgetTitle = useServerHas('history.forgetTitle') === true;
  const upToBar = useHandOff('up', chosen === null ? upTo : null);
  const room = useRoomToFill();
  const screen = useTheScreen();
  const cardWidth = Math.floor(
    (screen.width - tokens.space.edge * 2 - tokens.space.md * (ACROSS - 1)) / ACROSS,
  );
  const watched = useMemo(() => groupHistory(history.data?.pages.flat() ?? []), [history.data]);
  const first = watched[0];

  useEffect(() => {
    onMood(first === undefined ? null : moodOf(first));
  }, [first, onMood]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = history;

  const readOlder = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const forget = useCallback(
    (title: WatchedTitle) => {
      void forgetTitleInPlace(cache, title, canForgetTitle);
    },
    [cache, canForgetTitle],
  );

  const clearEverything = useCallback(() => {
    Alert.alert(
      say('tv.watchHistory.clearYourWatchHistory'),
      say('tv.watchHistory.everythingYouHaveWatchedIsRemoved'),
      [
        { text: say('common.keepIt'), style: 'cancel' },
        {
          text: say('common.forgetEverything'),
          style: 'destructive',
          onPress: () => {
            void forgetHistory()
              .catch(() => {
                Alert.alert(say('client.history.fetchHistory.yourHistoryCouldNotBeCleared'));
              })
              .finally(() => {
                void cache.invalidateQueries({ queryKey: viewingQueries.history().queryKey });
              });
          },
        },
      ],
    );
  }, [cache]);

  const closeChoices = useCallback(() => {
    setChosen(null);
  }, []);

  if (history.isPending) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  if (history.isError && watched.length === 0) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.empty}>{say('common.whatItHasDoneCouldNotBeRead')}</Text>
      </View>
    );
  }

  if (watched.length === 0) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.empty}>{say('tv.watchHistory.whatYouWatchShowsUpHere')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.page} onLayout={room.onLayout}>
      {room.height === null ? null : (
        <FlatList
          data={watched}
          numColumns={ACROSS}
          keyExtractor={(title) => title.key}
          style={{ height: room.height }}
          contentContainerStyle={styles.inside}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          onEndReached={readOlder}
          onEndReachedThreshold={1}
          ListHeaderComponent={
            <View style={styles.head}>
              <Text style={styles.title}>{say('common.watchHistory')}</Text>

              <Button
                label={say('common.forgetEverything')}
                icon={Bin}
                variant="ghost"
                onFocus={upToBar.arrive}
                onPress={clearEverything}
              />
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={tokens.colours.muted} />
            ) : hasNextPage ? null : (
              <Text style={styles.note}>
                {say('phone.theAccount.theHistory.viewingsAreForgottenAutomaticallyAfterA')}
              </Text>
            )
          }
          renderItem={({ item }) => {
            const known = progress.get(item.latest.mediaItemId);

            return (
              <HistoryCard
                watched={item}
                width={cardWidth}
                {...(known === undefined || resumeFor(progress, item.latest.mediaItemId) === null
                  ? {}
                  : { watchedFraction: watchedFraction(known) })}
                onFocus={(title) => {
                  upToBar.leave();
                  onMood(moodOf(title));
                }}
                onPress={setChosen}
              />
            );
          }}
        />
      )}

      {chosen === null ? null : (
        <HistoryChoices
          watched={chosen}
          progress={progress}
          onPlay={onPlay}
          onOpen={onOpen}
          onForget={forget}
          onClose={closeChoices}
        />
      )}
    </View>
  );
};

const WatchHistory = memo(WatchHistoryPage);

WatchHistory.displayName = 'WatchHistory';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingBottom: tokens.space.xl,
    gap: tokens.space.lg,
  },
  row: { gap: tokens.space.md },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  note: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    marginTop: tokens.space.md,
    textAlign: 'center',
  },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: tokens.colours.muted, fontSize: tokens.type.body },
});

export { WatchHistory };
