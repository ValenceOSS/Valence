import { useCallback, useMemo } from 'react';
import { ActionSheetIOS, Alert, FlatList, StyleSheet, View } from 'react-native';
import { upcomingIn } from '@ValenceClient/music/playQueue';
import { AFadedEdge } from '@ValenceMobile/components/AFadedEdge/AFadedEdge';
import { Button } from '@ValenceMobile/components/Button/Button';
import { AComingTrack } from '@ValenceMobile/components/TheMusicPlayer/components/TheUpNext/components/AComingTrack/AComingTrack';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { say } from '@ValenceI18n/say';
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
        { label: say('phone.theUpNext.playNow'), run: () => player.jumpTo(at) },
        ...(at > first
          ? [{ label: say('phone.theUpNext.moveUp'), run: () => player.moveInQueue(at, at - 1) }]
          : []),
        ...(at < last
          ? [{ label: say('phone.theUpNext.moveDown'), run: () => player.moveInQueue(at, at + 1) }]
          : []),
        { label: say('phone.theUpNext.takeOut'), run: () => player.removeFromQueue(at) },
      ];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: [...choices.map((choice) => choice.label), say('common.cancel')],
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
        {queue?.repeat === 'all'
          ? say('phone.theUpNext.startsAgain')
          : say('phone.theUpNext.nothingAfter')}
      </Words>
    );
  }

  const clear = () => {
    Alert.alert(say('phone.theUpNext.clearTitle'), say('phone.theUpNext.clearBody'), [
      { text: say('phone.theUpNext.keepIt'), style: 'cancel' },
      {
        text: say('phone.theUpNext.clear'),
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
          {queue.source === null
            ? say('phone.theUpNext.nextUp')
            : say('phone.theUpNext.nextFrom', { name: queue.source.name })}
        </Words>
        <Button tone="quiet" label={say('phone.theUpNext.clearLabel')} onPress={clear}>
          {say('phone.theUpNext.clear')}
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
