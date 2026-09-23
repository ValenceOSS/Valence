import { Image, StyleSheet, View } from 'react-native';
import { Music, Pause, Play, SkipForward } from 'lucide-react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { AGlass } from '@ValencePhone/components/AGlass/AGlass';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheNowPlayingBarProps } from './TheNowPlayingBar.types';

const ART = 42;

const HIGH = 60;

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    borderRadius: 8,
    height: ART,
    justifyContent: 'center',
    overflow: 'hidden',
    width: ART,
  },
  button: { padding: 8 },
  fills: { height: '100%', width: '100%' },
  opens: { flex: 1 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, height: HIGH, paddingHorizontal: 10 },
  said: { flex: 1, gap: 1 },
});

/**
 * What is playing, kept above the tabs while music plays, as the web keeps its now-playing bar at
 * the foot of every page: the album's cover, the track and who it is by, a way to pause it and a way
 * to skip it. Pressing anywhere else opens the player.
 *
 * Draws nothing while nothing is playing.
 *
 * @param onOpen - Told somebody wants the whole player.
 */
const TheNowPlayingBar = ({ onOpen }: TheNowPlayingBarProps) => {
  const colours = useTheColours();
  const { player, state } = useTheMusic();
  const track = state.current;

  if (track === null) {
    return null;
  }

  return (
    <View style={styles.row}>
      <AGlass roundness={16} />

      <View style={styles.opens}>
        <Button tone="bare" label="Open the player" onPress={onOpen}>
          <View style={[styles.row, { paddingHorizontal: 0 }]}>
            <View style={[styles.art, { backgroundColor: colours.surfaceRaised }]}>
              {track.album.hasArtwork ? (
                <Image
                  style={styles.fills}
                  source={{ uri: onThisServer(albumArtworkUrl(track.album.id)) }}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Icon of={Music} size={20} colour={colours.textMuted} />
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
        label={state.isPlaying ? 'Pause' : 'Play'}
        onPress={() => player.toggle()}
      >
        <View style={styles.button}>
          <Icon of={state.isPlaying ? Pause : Play} size={24} colour={colours.text} isFilled />
        </View>
      </Button>

      <Button tone="bare" label="Next" onPress={() => player.next()}>
        <View style={styles.button}>
          <Icon of={SkipForward} size={24} colour={colours.text} isFilled />
        </View>
      </Button>
    </View>
  );
};

TheNowPlayingBar.displayName = 'TheNowPlayingBar';

export { TheNowPlayingBar };
