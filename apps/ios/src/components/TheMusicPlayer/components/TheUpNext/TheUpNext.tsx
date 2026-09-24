import { useCallback, useMemo } from 'react';
import { ActionSheetIOS, Alert, FlatList, StyleSheet, View } from 'react-native';
import { upcomingIn } from '@ValenceClient/music/playQueue';
import { AFadedEdge } from '@ValencePhone/components/AFadedEdge/AFadedEdge';
import { Button } from '@ValencePhone/components/Button/Button';
import { AComingTrack } from '@ValencePhone/components/TheMusicPlayer/components/TheUpNext/components/AComingTrack/AComingTrack';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

const FADES_IN_OVER = 16;

const FADES_OUT_OVER = 48;

const NOTHING_COMING: readonly { at: number; track: MusicTrack }[] = [];

const styles = StyleSheet.create({
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  list: { paddingBottom: FADES_OUT_OVER, paddingTop: FADES_IN_OVER },
  whole: { flex: 1, gap: 4 },
});

/**
 * What plays after this, in the order it will play, as the web's queue lists it, each with its
 * album's cover: pressing one skips to it, and each has a menu to play it now, move it up or down, or
 * take it out. The lot can be cleared, which is asked about first since it cannot be put back. The
 * list scrolls in the room it is given, fading out at the top and bottom, and draws only the songs
 * near what is in view, so a long queue costs no more than a short one.
 */
const TheUpNext = () => {
  const { player, state } = useTheMusic();
  const queue = state.queue;
  const coming = useMemo(() => (queue === null ? NOTHING_COMING : upcomingIn(queue)), [queue]);
  const first = coming[0]?.at ?? 0;
  const last = coming.at(-1)?.at ?? 0;

  const skipTo = useCallback(
    (at: number) => {
      player.jumpTo(at);
    },
    [player],
  );

  const askAbout = useCallback(
    (at: number, title: string) => {
      const choices = [
        { label: 'Play now', run: () => player.jumpTo(at) },
        ...(at > first ? [{ label: 'Move up', run: () => player.moveInQueue(at, at - 1) }] : []),
        ...(at < last ? [{ label: 'Move down', run: () => player.moveInQueue(at, at + 1) }] : []),
        { label: 'Take out of the queue', run: () => player.removeFromQueue(at) },
      ];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: [...choices.map((choice) => choice.label), 'Cancel'],
          cancelButtonIndex: choices.length,
          destructiveButtonIndex: choices.length - 1,
        },
        (picked) => {
          choices[picked]?.run();
        },
      );
    },
    [player, first, last],
  );

  if (queue === null || coming.length === 0) {
    return (
      <Words tone="muted">
        {queue?.repeat === 'all' ? 'The queue starts again after this.' : 'Nothing after this.'}
      </Words>
    );
  }

  const clear = () => {
    Alert.alert('Clear up next?', 'Everything after this song comes off the queue.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          player.clearUpNext();
        },
      },
    ]);
  };

  return (
    <View style={styles.whole}>
      <View style={styles.head}>
        <Words size="heading">
          {queue.source === null ? 'Next up' : `Next from ${queue.source.name}`}
        </Words>
        <Button tone="quiet" label="Clear up next" onPress={clear}>
          Clear
        </Button>
      </View>

      <AFadedEdge leading={FADES_IN_OVER} trailing={FADES_OUT_OVER} isUpright>
        <FlatList
          data={coming}
          keyExtractor={({ at, track }) => `${track.id}:${at.toString()}`}
          renderItem={({ item }) => (
            <AComingTrack track={item.track} at={item.at} onPlay={skipTo} onMenu={askAbout} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </AFadedEdge>
    </View>
  );
};

TheUpNext.displayName = 'TheUpNext';

export { TheUpNext };
