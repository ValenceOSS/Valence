import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TVFocusGuideView,
  useTVEventHandler,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Cast,
  ChevronLeft,
  Heart as HeartOutline,
  ListMusic,
  Quote,
  Repeat,
  Repeat1,
  Shuffle,
} from '@keyline-icons/react-native';
import { Heart, Pause, Play, SkipBack, SkipForward } from '@keyline-icons/react-native/fill';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { describeAudioQuality } from '@ValenceClient/music/describeAudioQuality';
import { upcomingIn } from '@ValenceClient/music/playQueue';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { Badges } from '@ValenceTv/components/Badges/Badges';
import { Button } from '@ValenceTv/components/Button/Button';
import { CoverGlow } from '@ValenceTv/components/CoverGlow/CoverGlow';
import { FocusFence } from '@ValenceTv/components/FocusFence/FocusFence';
import { MusicCover } from '@ValenceTv/components/MusicCover/MusicCover';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { tokens } from '@ValenceTv/theme/tokens';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { DevicesPanel } from './components/DevicesPanel/DevicesPanel';
import { LyricLines } from './components/LyricLines/LyricLines';
import { Scrubber } from '@ValenceTv/components/Scrubber/Scrubber';
import { QueuePanel } from './components/QueuePanel/QueuePanel';
import type { HWEvent } from 'react-native';
import type { NowPlayingProps } from './NowPlaying.types';

const RESTS_AFTER_MS = 6000;

const FADES_MS = 500;

const BESIDE_WORDS = 460;

const ALONE = 540;

const CHANGES_MS = 700;

const BACK_ROOM = 110;

const NAME_RISES_BY = 28;

/**
 * What is playing, filling the screen as the television's own music app fills it: the whole screen
 * lit by the song's cover, the cover itself with the song's name and who sings it, how far through
 * it is, and the controls — shuffle, back, play, on, repeat, and beneath them the words, what plays
 * next and the devices to play on. Beside the name is a heart for liking it, and beneath it how the
 * song is being heard — lossless, and how finely, or the encode it has been sent as.
 *
 * Where the song has words they fill the right of the screen, timed to the song where they can be;
 * without them, or with them turned off, the cover sits in the middle on its own. Left alone a few
 * seconds while it plays, the controls fade away and the cover and the name settle down into the
 * middle of the screen, with the words beside them, until the remote is touched again.
 *
 * One song gives way to the next rather than cutting to it: the light and the cover dissolve into
 * the new one's, its name rises into place, and its words fade up in the old ones' stead.
 *
 * Menu closes whichever panel is open, and otherwise goes back to wherever this was opened from,
 * the music carrying on, as does the Back button at the top left, which fades with the controls. While this television is controlling another device, everything here is
 * that device's: its song, its place in it, and every button sent to it.
 *
 * @param onEmpty - Told when nothing is playing any more, to close the screen.
 * @param onBack - Told when the button at the top left is pressed, to go back as Menu does.
 */
const NowPlaying = ({ onEmpty, onBack }: NowPlayingProps) => {
  const { state, player } = useMusicPlayer(theMusicPlayer(), { followsPosition: true });
  const shown = useWhatIsPlaying(state);
  const watching = useQuery(profileQueries.watching());
  const favourites = useFavourites(watching.data?.id ?? null);
  const trackId = shown?.trackId ?? null;
  const lyrics = useQuery({
    ...musicQueries.lyrics(trackId ?? ''),
    enabled: trackId !== null && state.current?.hasLyrics !== false,
  });
  const [wantsWords, setWantsWords] = useState(true);
  const [panel, setPanel] = useState<'queue' | 'devices' | null>(null);
  const [touchedAt, setTouchedAt] = useState(() => Date.now());
  const [isResting, setIsResting] = useState(false);
  const [controlsHeight, setControlsHeight] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));
  const [arrival] = useState(() => new Animated.Value(1));

  useEffect(() => {
    arrival.setValue(0);
    Animated.timing(arrival, {
      toValue: 1,
      duration: CHANGES_MS,
      useNativeDriver: true,
    }).start();
  }, [trackId, arrival]);

  const words = lyrics.data ?? null;
  const hasWords = words !== null && words.lines.length > 0;
  const isBesideWords = wantsWords && hasWords;
  const isPlaying = shown?.isPlaying ?? false;

  useEffect(() => {
    if (shown === null && state.current === null && state.remote === null) {
      onEmpty();
    }
  }, [shown, state, onEmpty]);

  const touch = useCallback(() => {
    setTouchedAt(Date.now());
    setIsResting(false);
  }, []);

  useEffect(() => {
    if (!isPlaying || panel !== null) {
      return;
    }

    const timer = setTimeout(() => {
      setIsResting(true);
    }, RESTS_AFTER_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isPlaying, panel, touchedAt]);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: isResting ? 0 : 1,
      duration: FADES_MS,
      useNativeDriver: true,
    }).start();
  }, [fade, isResting]);

  const hear = useCallback(
    (event: HWEvent) => {
      if (event.eventType !== 'blur' && event.eventType !== 'focus') {
        touch();
      }
    },
    [touch],
  );

  useTVEventHandler(hear);

  const closePanel = useCallback(() => {
    setPanel(null);
  }, []);

  useMenuButton(panel === null ? null : closePanel, true);

  const upcoming = useMemo(
    () => (state.queue === null ? [] : upcomingIn(state.queue)),
    [state.queue],
  );

  if (shown === null) {
    return <View style={styles.screen} />;
  }

  const cover = shown.hasArtwork ? albumArtworkUrl(shown.albumId) : null;
  const isLiked = favourites.isKept(shown.trackId);
  const repeat = state.queue?.repeat ?? 'off';
  const isShuffled = state.queue?.isShuffled ?? false;
  const isOrdered = state.queue?.isOrdered ?? false;
  const coverSize = isBesideWords ? BESIDE_WORDS : ALONE;
  const playingFile = state.remote === null ? state.current : null;
  const quality =
    playingFile === null
      ? []
      : [
          describeAudioQuality(state.playingQuality ?? state.quality, playingFile).label,
          ...(playingFile.isLossless &&
          (state.playingQuality ?? state.quality) === 'lossless' &&
          playingFile.bitDepth !== null &&
          playingFile.sampleRate !== null
            ? [
                `${playingFile.bitDepth.toString()}-bit · ${(playingFile.sampleRate / 1000).toString()} kHz`,
              ]
            : []),
        ];
  const settles = (controlsHeight + tokens.space.lg) / 2;

  return (
    <View style={styles.screen}>
      <CoverGlow path={cover} />

      <FocusFence isShut={panel !== null} style={styles.stage}>
        <Animated.View style={[styles.back, { opacity: fade }]}>
          <Button
            label="Back"
            icon={ChevronLeft}
            variant="overlay"
            size="md"
            isPill
            onPress={onBack}
          />
        </Animated.View>

        <TVFocusGuideView autoFocus style={[styles.side, !isBesideWords && styles.alone]}>
          <Animated.View
            style={[
              styles.lead,
              {
                transform: [
                  {
                    translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [settles, 0] }),
                  },
                ],
              },
            ]}
          >
            <MusicCover
              kind="album"
              art={cover}
              size={coverSize}
              isUrgent
              style={styles.cover}
              crossfadeMs={CHANGES_MS}
            />

            <Animated.View
              style={[
                styles.names,
                {
                  width: coverSize,
                  opacity: arrival,
                  transform: [
                    {
                      translateY: arrival.interpolate({
                        inputRange: [0, 1],
                        outputRange: [NAME_RISES_BY, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.titled}>
                <View style={styles.titleWords}>
                  <Text numberOfLines={1} style={styles.title}>
                    {shown.title}
                  </Text>
                </View>
                <Button
                  label={isLiked ? `Unlike ${shown.title}` : `Like ${shown.title}`}
                  icon={isLiked ? Heart : HeartOutline}
                  variant="ghost"
                  size="md"
                  isIconOnly
                  iconSize={34}
                  onPress={() => {
                    favourites.toggle(shown.trackId);
                  }}
                />
              </View>
              <Text numberOfLines={1} style={styles.artists}>
                {shown.artists.map((artist) => artist.name).join(', ')}
                {shown.albumTitle === null ? '' : ` — ${shown.albumTitle}`}
              </Text>
              {quality.length === 0 ? null : (
                <View style={styles.badges}>
                  <Badges badges={quality} />
                </View>
              )}
              {state.remote === null ? null : (
                <Text style={styles.remote}>Playing on {state.remote.label}</Text>
              )}
            </Animated.View>
          </Animated.View>

          <Animated.View
            style={[styles.controls, { width: coverSize, opacity: fade }]}
            onLayout={(event) => {
              setControlsHeight(event.nativeEvent.layout.height);
            }}
          >
            <Scrubber
              position={shown.positionSeconds}
              duration={shown.durationSeconds}
              onSeek={player.seek}
            />

            <View style={styles.transport}>
              <Button
                label={isShuffled ? 'Shuffle is on' : 'Shuffle'}
                icon={Shuffle}
                variant={isShuffled ? 'soft' : 'ghost'}
                isIconOnly
                isDisabled={isOrdered}
                onPress={player.toggleShuffle}
              />
              <Button
                label="Back"
                icon={SkipBack}
                variant="ghost"
                isIconOnly
                iconSize={40}
                onPress={player.previous}
              />
              <Button
                label={isPlaying ? 'Pause' : 'Play'}
                icon={isPlaying ? Pause : Play}
                variant="ghost"
                size="xl"
                isIconOnly
                iconSize={64}
                hasPreferredFocus
                onPress={player.toggle}
              />
              <Button
                label="Next"
                icon={SkipForward}
                variant="ghost"
                isIconOnly
                iconSize={40}
                onPress={player.next}
              />
              <Button
                label={
                  repeat === 'one'
                    ? 'Repeating this song'
                    : repeat === 'all'
                      ? 'Repeating'
                      : 'Repeat'
                }
                icon={repeat === 'one' ? Repeat1 : Repeat}
                variant={repeat === 'off' ? 'ghost' : 'soft'}
                isIconOnly
                isDisabled={isOrdered}
                onPress={player.cycleRepeat}
              />
            </View>

            <View style={styles.extras}>
              <Button
                label={isBesideWords ? 'Hide the words' : 'Show the words'}
                icon={Quote}
                variant={isBesideWords ? 'soft' : 'ghost'}
                size="md"
                isIconOnly
                isDisabled={!hasWords}
                onPress={() => {
                  setWantsWords((was) => !was);
                }}
              />
              <Button
                label="Up next"
                icon={ListMusic}
                variant="ghost"
                size="md"
                isIconOnly
                onPress={() => {
                  setPanel('queue');
                }}
              />
              <Button
                label="Play on another device"
                icon={Cast}
                variant={state.remote === null ? 'ghost' : 'soft'}
                size="md"
                isIconOnly
                onPress={() => {
                  setPanel('devices');
                }}
              />
            </View>
          </Animated.View>
        </TVFocusGuideView>

        {isBesideWords ? (
          <TVFocusGuideView autoFocus style={styles.words}>
            <FadeIn key={trackId}>
              <LyricLines
                lyrics={words}
                positionMs={shown.positionSeconds * 1000}
                onSeek={player.seek}
              />
            </FadeIn>
          </TVFocusGuideView>
        ) : null}
      </FocusFence>

      {panel === 'queue' ? (
        <QueuePanel
          upcoming={upcoming}
          onJump={(at) => {
            player.jumpTo(at);
            closePanel();
          }}
        />
      ) : null}

      {panel === 'devices' ? <DevicesPanel shown={shown} onChosen={closePanel} /> : null}
    </View>
  );
};

NowPlaying.displayName = 'NowPlaying';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.colours.canvas },
  back: { position: 'absolute', top: tokens.space.lg, left: tokens.space.edge, zIndex: 1 },
  stage: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: BACK_ROOM,
    paddingHorizontal: tokens.space.edge,
    gap: tokens.space.xl * 1.5,
  },
  side: { justifyContent: 'center', gap: tokens.space.lg },
  alone: { flex: 1, alignItems: 'center' },
  cover: {
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },
  lead: { gap: tokens.space.lg },
  names: { gap: tokens.space.xs },
  titled: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  titleWords: { flex: 1 },
  badges: { flexDirection: 'row', gap: tokens.space.xs, marginTop: tokens.space.xs },
  title: { color: '#ffffff', fontSize: tokens.type.heading + 4, fontWeight: '800' },
  artists: { color: 'rgba(255,255,255,0.75)', fontSize: tokens.type.body },
  remote: { color: 'rgba(255,255,255,0.6)', fontSize: tokens.type.small },
  controls: { gap: tokens.space.md },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  extras: { flexDirection: 'row', justifyContent: 'center', gap: tokens.space.lg },
  words: { flex: 1, paddingTop: 160, paddingBottom: tokens.space.xl },
});

export { NowPlaying };
