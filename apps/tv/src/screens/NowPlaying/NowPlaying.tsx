import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TVFocusGuideView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRemote } from '@ValenceTv/remote/useRemote';
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
  Sparkles,
  Users,
} from '@keyline-icons/react-native';
import { Heart, Pause, Play, SkipBack, SkipForward } from '@keyline-icons/react-native/fill';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { describeAudioQuality } from '@ValenceClient/music/describeAudioQuality';
import { upcomingIn } from '@ValenceClient/music/playQueue';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useListeningParty } from '@ValenceClient/party/listeningParty';
import { listenerControls } from '@ValenceClient/party/listenerControls';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { PartyPanel } from '@ValenceTv/components/PartyPanel/PartyPanel';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { Badges } from '@ValenceTv/components/Badges/Badges';
import { Button } from '@ValenceTv/components/Button/Button';
import { CoverGlow } from '@ValenceTv/components/CoverGlow/CoverGlow';
import { FocusFence } from '@ValenceTv/components/FocusFence/FocusFence';
import { MusicCover } from '@ValenceTv/components/MusicCover/MusicCover';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { tokens } from '@ValenceTv/theme/tokens';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { DevicesPanel } from './components/DevicesPanel/DevicesPanel';
import { LyricLines } from './components/LyricLines/LyricLines';
import { Scrubber } from '@ValenceTv/components/Scrubber/Scrubber';
import { QueuePanel } from './components/QueuePanel/QueuePanel';
import { shuffleModeOf } from '@ValenceClient/music/shuffleModeOf';
import type { HWEvent } from 'react-native';
import type { NowPlayingProps } from './NowPlaying.types';
import { say } from '@ValenceI18n/say';

const SHUFFLE_LABELS = {
  off: say('common.shuffle'),
  on: say('tv.nowPlaying.shuffleIsOn'),
  smart: say('tv.nowPlaying.smartShuffleIsOn'),
} as const;

const NO_PICKS: readonly string[] = [];

const RESTS_AFTER_MS = 6000;

const FADES_MS = 500;

const BESIDE_WORDS = 460;

const ALONE = 540;

const CHANGES_MS = 700;

const BACK_ROOM = 110;

const NAME_RISES_BY = 28;

const SMALLEST_COVER = 280;

const TITLE_LINE = 48;

const HEART = 72;

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
 * the music carrying on, as does the Back button at the top left, which fades with the controls and
 * which pressing up from the heart reaches though it sits away to the left, and pressing down from
 * it goes back to the heart. The cover is as large
 * as the screen leaves room for above the song's name and the controls, so nothing falls off its
 * foot. While this television is controlling another device, everything here is
 * that device's: its song, its place in it, and every button sent to it.
 *
 * In somebody else's listening party the song and where it has got to are the host's: skipping,
 * shuffling and repeating are put away, and pausing and moving through the song go to the host
 * unless they have let everybody. The party is opened from beside the other ways to send the music
 * elsewhere, to start one around the song playing, see who is listening, or leave.
 *
 * @param onEmpty - Told when nothing is playing any more, to close the screen.
 * @param onBack - Told when the button at the top left is pressed, to go back as Menu does.
 * @param watchParty - The party this television holds, through which a listening party is had.
 */
const NowPlaying = ({ onEmpty, onBack, watchParty }: NowPlayingProps) => {
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
  const [panel, setPanel] = useState<'queue' | 'devices' | 'party' | null>(null);
  const listening = useListeningParty();
  const everyone = useQuery({
    ...sessionQueries.everyone(),
    enabled: (watchParty?.party ?? null) !== null,
  });
  const household = useMemo(
    () => (everyone.data ?? []).map((person) => ({ id: person.id, name: person.name })),
    [everyone.data],
  );
  const [touchedAt, setTouchedAt] = useState(() => Date.now());
  const [isResting, setIsResting] = useState(false);
  const [controlsHeight, setControlsHeight] = useState(0);
  const [namesHeight, setNamesHeight] = useState(0);
  const [backButton, setBackButton] = useState<View | null>(null);
  const [heart, setHeart] = useState<View | null>(null);
  const upToBack = useHandOff('up', backButton);
  const downFromBack = useHandOff('down', heart);

  const atTheBack = useCallback(() => {
    upToBack.leave();
    downFromBack.arrive();
  }, [upToBack, downFromBack]);

  const atTheHeart = useCallback(() => {
    upToBack.arrive();
    downFromBack.leave();
  }, [upToBack, downFromBack]);

  const awayFromTheEdges = useCallback(() => {
    upToBack.leave();
    downFromBack.leave();
  }, [upToBack, downFromBack]);
  const screen = useWindowDimensions();
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

  useRemote(hear);

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
  const shuffling = shuffleModeOf(state.queue);
  const isOrdered = state.queue?.isOrdered ?? false;
  const room =
    screen.height -
    BACK_ROOM -
    tokens.space.xl -
    controlsHeight -
    namesHeight -
    tokens.space.lg * 3;
  const columnWidth = isBesideWords ? BESIDE_WORDS : ALONE;
  const coverSize = Math.max(Math.min(columnWidth, room), SMALLEST_COVER);
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
  const controls = listenerControls(listening, shown, player);
  const { isFollowing } = controls;

  return (
    <View style={styles.screen}>
      <CoverGlow path={cover} />

      <FocusFence isShut={panel !== null} style={styles.stage}>
        <Animated.View style={[styles.back, { opacity: fade }]}>
          <Button
            ref={setBackButton}
            label={say('common.back')}
            icon={ChevronLeft}
            variant="overlay"
            size="md"
            isPill
            onFocus={atTheBack}
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
              onLayout={(event) => {
                setNamesHeight(event.nativeEvent.layout.height);
              }}
              style={[
                styles.names,
                {
                  width: columnWidth,
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
                <View style={styles.heart}>
                  <Button
                    label={
                      isLiked
                        ? say('common.unlikeTitle', { title: shown.title })
                        : say('common.likeTitle', { title: shown.title })
                    }
                    icon={isLiked ? Heart : HeartOutline}
                    variant="ghost"
                    size="md"
                    isIconOnly
                    iconSize={34}
                    ref={setHeart}
                    onFocus={atTheHeart}
                    onPress={() => {
                      favourites.toggle(shown.trackId);
                    }}
                  />
                </View>
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
                <Text style={styles.remote}>
                  {say('common.playingOnLabel', { label: state.remote.label })}
                </Text>
              )}
            </Animated.View>
          </Animated.View>

          <Animated.View
            style={[styles.controls, { width: columnWidth, opacity: fade }]}
            onLayout={(event) => {
              setControlsHeight(event.nativeEvent.layout.height);
            }}
          >
            <Scrubber
              onFocus={awayFromTheEdges}
              position={shown.positionSeconds}
              duration={shown.durationSeconds}
              onSeek={controls.seek}
            />

            <View style={styles.transport}>
              <Button
                onFocus={awayFromTheEdges}
                label={SHUFFLE_LABELS[shuffling]}
                icon={shuffling === 'smart' ? Sparkles : Shuffle}
                variant={shuffling === 'off' ? 'ghost' : 'soft'}
                isIconOnly
                isDisabled={isOrdered || isFollowing}
                onPress={player.cycleShuffle}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={say('common.back')}
                icon={SkipBack}
                variant="ghost"
                isIconOnly
                iconSize={40}
                isDisabled={isFollowing}
                onPress={player.previous}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={isPlaying ? say('common.pause') : say('common.play')}
                icon={isPlaying ? Pause : Play}
                variant="ghost"
                size="xl"
                isIconOnly
                iconSize={64}
                hasPreferredFocus
                isDisabled={!controls.mayPlayPause}
                onPress={controls.playPause}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={say('common.next')}
                icon={SkipForward}
                variant="ghost"
                isIconOnly
                iconSize={40}
                isDisabled={isFollowing}
                onPress={player.next}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={
                  repeat === 'one'
                    ? say('tv.nowPlaying.repeatingThisSong')
                    : repeat === 'all'
                      ? say('tv.nowPlaying.repeating')
                      : say('tv.nowPlaying.repeat')
                }
                icon={repeat === 'one' ? Repeat1 : Repeat}
                variant={repeat === 'off' ? 'ghost' : 'soft'}
                isIconOnly
                isDisabled={isOrdered || isFollowing}
                onPress={player.cycleRepeat}
              />
            </View>

            <View style={styles.extras}>
              <Button
                onFocus={awayFromTheEdges}
                label={
                  isBesideWords
                    ? say('tv.nowPlaying.hideTheWords')
                    : say('tv.nowPlaying.showTheWords')
                }
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
                onFocus={awayFromTheEdges}
                label={say('common.upNext')}
                icon={ListMusic}
                variant="ghost"
                size="md"
                isIconOnly
                onPress={() => {
                  setPanel('queue');
                }}
              />
              <Button
                onFocus={awayFromTheEdges}
                label={say('common.playOnAnotherDevice')}
                icon={Cast}
                variant={state.remote === null ? 'ghost' : 'soft'}
                size="md"
                isIconOnly
                onPress={() => {
                  setPanel('devices');
                }}
              />
              {watchParty === undefined ? null : (
                <Button
                  onFocus={awayFromTheEdges}
                  label={say('common.listeningParty')}
                  icon={Users}
                  variant={listening === null ? 'ghost' : 'soft'}
                  size="md"
                  isIconOnly
                  onPress={() => {
                    setPanel('party');
                  }}
                />
              )}
            </View>
          </Animated.View>
        </TVFocusGuideView>

        {isBesideWords ? (
          <TVFocusGuideView autoFocus style={styles.words}>
            <FadeIn key={trackId}>
              <LyricLines
                lyrics={words}
                positionMs={shown.positionSeconds * 1000}
                onSeek={controls.seek}
              />
            </FadeIn>
          </TVFocusGuideView>
        ) : null}
      </FocusFence>

      {panel === 'queue' ? (
        <QueuePanel
          upcoming={upcoming}
          picks={state.queue?.picks ?? NO_PICKS}
          onJump={(at) => {
            player.jumpTo(at);
            closePanel();
          }}
        />
      ) : null}

      {panel === 'devices' ? <DevicesPanel shown={shown} onChosen={closePanel} /> : null}

      {panel === 'party' && watchParty !== undefined ? (
        <PartyPanel
          kind="listen"
          watchParty={watchParty}
          mediaId={shown.trackId}
          people={household}
          onLeave={closePanel}
        />
      ) : null}
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
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },
  lead: { gap: tokens.space.lg },
  names: { gap: tokens.space.xs },
  titled: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  titleWords: { flex: 1 },
  heart: { marginVertical: (TITLE_LINE - HEART) / 2 },
  badges: { flexDirection: 'row', gap: tokens.space.xs, marginTop: tokens.space.xs },
  title: {
    color: '#ffffff',
    fontSize: tokens.type.heading + 4,
    lineHeight: TITLE_LINE,
    fontWeight: '800',
  },
  artists: { color: 'rgba(255,255,255,0.75)', fontSize: tokens.type.body },
  remote: { color: 'rgba(255,255,255,0.6)', fontSize: tokens.type.small },
  controls: { gap: tokens.space.md },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  extras: { flexDirection: 'row', justifyContent: 'center', gap: tokens.space.lg },
  words: { flex: 1, paddingTop: 160, paddingBottom: tokens.space.xl },
});

export { NowPlaying };
