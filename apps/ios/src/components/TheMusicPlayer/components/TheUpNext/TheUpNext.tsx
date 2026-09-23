import { MoreHorizontal, MusicNote } from '@keyline-icons/react-native';
import { ActionSheetIOS, Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { upcomingIn } from '@ValenceClient/music/playQueue';
import { AFadedEdge } from '@ValencePhone/components/AFadedEdge/AFadedEdge';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';

const ART = 44;

const FADES_IN_OVER = 16;

const FADES_OUT_OVER = 48;

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    borderRadius: 6,
    height: ART,
    justifyContent: 'center',
    overflow: 'hidden',
    width: ART,
  },
  fills: { height: '100%', width: '100%' },
  head: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  list: { paddingBottom: FADES_OUT_OVER, paddingTop: FADES_IN_OVER },
  menu: { padding: 10 },
  play: { flex: 1 },
  row: { alignItems: 'center', flexDirection: 'row' },
  said: { flex: 1, gap: 2 },
  track: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 6 },
  whole: { flex: 1, gap: 4 },
});

/**
 * What plays after this, in the order it will play, as the web's queue lists it, each with its
 * album's cover: pressing one skips to it, and each has a menu to play it now, move it up or down, or
 * take it out. The lot can be cleared, which is asked about first since it cannot be put back. The
 * list scrolls in the room it is given, fading out at the top and bottom.
 */
const TheUpNext = () => {
  const colours = useTheColours();
  const { player, state } = useTheMusic();
  const queue = state.queue;
  const coming = queue === null ? [] : upcomingIn(queue);

  if (queue === null || coming.length === 0) {
    return (
      <Words tone="muted">
        {queue?.repeat === 'all' ? 'The queue starts again after this.' : 'Nothing after this.'}
      </Words>
    );
  }

  const first = coming[0]?.at ?? 0;
  const last = coming.at(-1)?.at ?? 0;

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

  const askAbout = (at: number, title: string) => {
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
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {coming.map(({ at, track }) => (
            <View key={`${track.id}:${at.toString()}`} style={styles.row}>
              <View style={styles.play}>
                <Button
                  tone="bare"
                  label={`Play ${track.title} now`}
                  onPress={() => {
                    player.jumpTo(at);
                  }}
                >
                  <View style={styles.track}>
                    <View style={[styles.art, { backgroundColor: colours.surfaceRaised }]}>
                      {track.album.hasArtwork ? (
                        <Image
                          style={styles.fills}
                          source={{ uri: onThisServer(albumArtworkUrl(track.album.id)) }}
                          accessibilityIgnoresInvertColors
                        />
                      ) : (
                        <Icon of={MusicNote} size={18} colour={colours.textMuted} />
                      )}
                    </View>
                    <View style={styles.said}>
                      <Words lines={1}>{track.title}</Words>
                      <Words size="small" tone="muted" lines={1}>
                        {track.artists.map((artist) => artist.name).join(', ')}
                      </Words>
                    </View>
                  </View>
                </Button>
              </View>

              <Button
                tone="bare"
                label={`More for ${track.title}`}
                onPress={() => {
                  askAbout(at, track.title);
                }}
              >
                <View style={styles.menu}>
                  <Icon of={MoreHorizontal} size={20} colour={colours.textMuted} />
                </View>
              </Button>
            </View>
          ))}
        </ScrollView>
      </AFadedEdge>
    </View>
  );
};

TheUpNext.displayName = 'TheUpNext';

export { TheUpNext };
