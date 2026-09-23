import { useState } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Heart,
  ListMusic,
  MicVocal,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { AirPlayButton } from '@ValencePhone/components/AirPlayButton/AirPlayButton';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { SCREEN_EDGE } from '@ValencePhone/components/Screen/SCREEN_EDGE';
import { Slider } from '@ValencePhone/components/Slider/Slider';
import { TheLyrics } from '@ValencePhone/components/TheMusicPlayer/components/TheLyrics/TheLyrics';
import { TheUpNext } from '@ValencePhone/components/TheMusicPlayer/components/TheUpNext/TheUpNext';
import { Words } from '@ValencePhone/components/Words/Words';
import { asAClock } from '@ValencePhone/components/Watching/asAClock';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import type { TheMusicPlayerProps } from './TheMusicPlayer.types';

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  controls: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  extras: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around' },
  fills: { height: '100%', width: '100%' },
  named: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  reach: { padding: 10 },
  said: { flex: 1, gap: 2 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
});

/**
 * The whole music player, as the web's opens over its pages: the album's cover large, the track
 * and who it is by, a way to like it, where it has got to and a way to move through it, and the
 * buttons — shuffle, back, play, forward, repeat — with a way to send it elsewhere on the network
 * and a way to see what comes next or the words being sung.
 *
 * @param onArtist - Told to open an artist.
 * @param onBack - Told somebody is done with it.
 */
const TheMusicPlayer = ({ onArtist, onBack }: TheMusicPlayerProps) => {
  const colours = useTheColours();
  const { width } = useWindowDimensions();
  const { player, state } = useTheMusic();
  const favourites = useFavourites(useWatchingProfile());
  const [beside, setBeside] = useState<'nothing' | 'queue' | 'lyrics'>('nothing');
  const track = state.current;
  const side = width - SCREEN_EDGE * 2;

  if (track === null) {
    return (
      <Screen centres onBack={onBack}>
        <Words tone="muted" isCentred>
          Nothing is playing.
        </Words>
      </Screen>
    );
  }

  const isLiked = favourites.isKept(track.id);
  const repeat = state.queue?.repeat ?? 'off';
  const isShuffled = state.queue?.isShuffled ?? false;
  const lit = (isOn: boolean) => (isOn ? colours.accent : colours.textMuted);

  return (
    <Screen scrolls onBack={onBack}>
      <View
        style={[styles.art, { backgroundColor: colours.surfaceRaised, height: side, width: side }]}
      >
        {track.album.hasArtwork ? (
          <Image
            style={styles.fills}
            source={{ uri: onThisServer(albumArtworkUrl(track.album.id)) }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Icon of={Music} size={80} colour={colours.textMuted} />
        )}
      </View>

      <View style={styles.named}>
        <View style={styles.said}>
          <Words size="heading" lines={2}>
            {track.title}
          </Words>
          <Button
            tone="bare"
            label={`Open ${track.artists[0]?.name ?? 'the artist'}`}
            onPress={() => {
              const first = track.artists[0];

              if (first !== undefined) {
                onArtist(first.id);
              }
            }}
          >
            <Words tone="muted" lines={1}>
              {track.artists.map((artist) => artist.name).join(', ')}
            </Words>
          </Button>
        </View>

        <Button
          tone="bare"
          label={isLiked ? 'Remove from liked songs' : 'Like'}
          isChosen={isLiked}
          onPress={() => {
            favourites.toggle(track.id);
          }}
        >
          <View style={styles.reach}>
            <Icon
              of={Heart}
              size={26}
              colour={isLiked ? colours.danger : colours.text}
              isFilled={isLiked}
            />
          </View>
        </Button>
      </View>

      <View>
        <Slider
          label={`Move through ${track.title}`}
          value={state.positionSeconds}
          furthest={state.durationSeconds}
          colour={colours.text}
          restColour={withAlpha(colours.text, 0.2)}
          aheadColour={withAlpha(colours.text, 0.35)}
          onScrubbed={(to) => {
            player.seek(to);
          }}
        />
        <View style={styles.times}>
          <Words size="small" tone="muted">
            {asAClock(state.positionSeconds)}
          </Words>
          <Words size="small" tone="muted">
            {`−${asAClock(Math.max(state.durationSeconds - state.positionSeconds, 0))}`}
          </Words>
        </View>
      </View>

      <View style={styles.controls}>
        <Button
          tone="bare"
          label="Shuffle"
          isChosen={isShuffled}
          onPress={() => player.toggleShuffle()}
        >
          <View style={styles.reach}>
            <Icon of={Shuffle} size={22} colour={lit(isShuffled)} />
          </View>
        </Button>

        <Button tone="bare" label="Previous" onPress={() => player.previous()}>
          <View style={styles.reach}>
            <Icon of={SkipBack} size={32} colour={colours.text} isFilled />
          </View>
        </Button>

        <Button
          tone="bare"
          label={state.isPlaying ? 'Pause' : 'Play'}
          onPress={() => player.toggle()}
        >
          <View style={styles.reach}>
            <Icon of={state.isPlaying ? Pause : Play} size={52} colour={colours.text} isFilled />
          </View>
        </Button>

        <Button tone="bare" label="Next" onPress={() => player.next()}>
          <View style={styles.reach}>
            <Icon of={SkipForward} size={32} colour={colours.text} isFilled />
          </View>
        </Button>

        <Button
          tone="bare"
          label={
            repeat === 'off'
              ? 'Repeat everything'
              : repeat === 'all'
                ? 'Repeat this song'
                : 'Stop repeating'
          }
          isChosen={repeat !== 'off'}
          onPress={() => player.cycleRepeat()}
        >
          <View style={styles.reach}>
            <Icon
              of={repeat === 'one' ? Repeat1 : Repeat}
              size={22}
              colour={lit(repeat !== 'off')}
            />
          </View>
        </Button>
      </View>

      <View style={styles.extras}>
        <Button
          tone="bare"
          label="Words"
          isChosen={beside === 'lyrics'}
          onPress={() => {
            setBeside((was) => (was === 'lyrics' ? 'nothing' : 'lyrics'));
          }}
        >
          <View style={styles.reach}>
            <Icon of={MicVocal} size={22} colour={lit(beside === 'lyrics')} />
          </View>
        </Button>

        <AirPlayButton />

        <Button
          tone="bare"
          label="Up next"
          isChosen={beside === 'queue'}
          onPress={() => {
            setBeside((was) => (was === 'queue' ? 'nothing' : 'queue'));
          }}
        >
          <View style={styles.reach}>
            <Icon of={ListMusic} size={22} colour={lit(beside === 'queue')} />
          </View>
        </Button>
      </View>

      {state.problem === null ? null : <Words tone="danger">{state.problem}</Words>}

      {beside === 'queue' ? <TheUpNext /> : null}
      {beside === 'lyrics' ? (
        <TheLyrics trackId={track.id} atSeconds={state.positionSeconds} />
      ) : null}
    </Screen>
  );
};

TheMusicPlayer.displayName = 'TheMusicPlayer';

export { TheMusicPlayer };
