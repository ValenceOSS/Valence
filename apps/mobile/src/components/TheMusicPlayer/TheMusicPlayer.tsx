import {
  Cast,
  Heart,
  ListMusic,
  Mic,
  MusicNote,
  Repeat,
  Repeat1,
} from '@keyline-icons/react-native';
import {
  Heart as HeartFilled,
  Pause as PauseFilled,
  Play as PlayFilled,
  SkipBack as SkipBackFilled,
  SkipForward as SkipForwardFilled,
} from '@keyline-icons/react-native/fill';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { howTheFileSounds } from '@ValenceClient/music/howTheFileSounds';
import { whatTheFileHolds } from '@ValenceClient/music/whatTheFileHolds';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { ALitCircle } from '@ValenceMobile/components/ALitCircle/ALitCircle';
import { ADevicesSheet } from '@ValenceMobile/components/ADevicesSheet/ADevicesSheet';
import { AirPlayButton } from '@ValenceMobile/components/AirPlayButton/AirPlayButton';
import { AMoodBackground } from '@ValenceMobile/components/AMoodBackground/AMoodBackground';
import { AVolumeSlider } from '@ValenceMobile/components/AVolumeSlider/AVolumeSlider';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { TheLyrics } from '@ValenceMobile/components/TheMusicPlayer/components/TheLyrics/TheLyrics';
import { ThePlaceInTheSong } from '@ValenceMobile/components/TheMusicPlayer/components/ThePlaceInTheSong/ThePlaceInTheSong';
import { TheUpNext } from '@ValenceMobile/components/TheMusicPlayer/components/TheUpNext/TheUpNext';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { usePrefersStillness } from '@ValenceMobile/hooks/usePrefersStillness';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import { EASINGS } from '@ValenceMobile/theme/EASINGS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import { shuffleModeOf } from '@ValenceClient/music/shuffleModeOf';
import { AShuffleMark } from '@ValenceMobile/components/AShuffleMark/AShuffleMark';
import type { TheMusicPlayerProps } from './TheMusicPlayer.types';

const SHUFFLE_LABELS = {
  off: 'Shuffle',
  on: 'Smart shuffle',
  smart: 'Stop shuffling',
} as const;

const RESTING = 0.86;

const SMALL = 64;

const TITLE_ROOM = 64;

const SWITCH_SHIFT = 32;

const TURNS_PAST = 0.25;

const TURNS_FASTER_THAN = 0.5;

const TURNS_IN_MS = 220;

const HELD_BACK = 0.25;

const BREATHES = { ...SPRINGS.heavy, useNativeDriver: true } as const;

const FOLDS = { ...SPRINGS.liquid, overshootClamping: true, useNativeDriver: true } as const;

const styles = StyleSheet.create({
  art: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  beside: { flex: 1 },
  controls: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cover: { left: 0, position: 'absolute', top: 0, transformOrigin: 'top left' },
  floating: {
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
  },
  extras: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-around' },
  fills: { height: '100%', width: '100%' },
  foot: { gap: 14 },
  head: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  reach: { padding: 10 },
  said: { flex: 1, gap: 2 },
  top: { flex: 1, gap: 20 },
});

/**
 * The whole music player, laid out as Apple Music's is: the album's cover large, which opens the
 * album, the song and who it is by, and at the foot where the song has got to, the buttons, the phone's own volume
 * slider, and ways to send it elsewhere, read the words or see what comes next.
 *
 * It is lit in the colours of the cover, as the web's music is, and the cover floats: settled back
 * a little while the song is paused, and forward again when it plays. A lossless file says so, and
 * pressing that says exactly what the file is. Going on to the next song slides the cover away to
 * the left and the next one in from the right; going back slides them the other way.
 * The covers either side wait just off the screen, so swiping the cover pages to the song before
 * or after it the way a carousel does: the cover follows the finger, the next one slides in with
 * it, and letting go far enough or fast enough finishes the turn and plays that song. Nothing is
 * redrawn when it lands, since the cover that slid in is the one that stays.
 *
 * Asking for the words or for what comes next folds the cover away into the corner beside the song's
 * name, and the words or the queue take its place until they are asked away again. Going from one
 * to the other slides the one leaving away towards its button and brings the other in from the
 * side of its own, fading between them — only fading, for somebody who has asked for less movement.
 *
 * @param onArtist - Told to open an artist.
 * @param onAlbum - Told to open an album.
 * @param onBack - Told somebody is done with it.
 */
const TheMusicPlayer = ({ onArtist, onAlbum, onBack }: TheMusicPlayerProps) => {
  const colours = useTheColours();
  const { width } = useWindowDimensions();
  const { player, state } = useTheMusic();
  const whatIsPlaying = useWhatIsPlaying(state);
  const isPlaying = whatIsPlaying?.isPlaying ?? state.isPlaying;
  const [isChoosingDevice, setIsChoosingDevice] = useState(false);
  const favourites = useFavourites(useWatchingProfile());
  const [beside, setBeside] = useState<'nothing' | 'queue' | 'lyrics'>('nothing');
  const [topHigh, setTopHigh] = useState(0);
  const isStill = usePrefersStillness();
  const track = state.current;
  const across = width - SCREEN_EDGE * 2;
  const side = Math.max(Math.min(across, topHigh - TITLE_ROOM), SMALL);
  const cover =
    track === null || !track.album.hasArtwork
      ? null
      : onThisServer(albumArtworkUrl(track.album.id));
  const lights = usePictureLights(cover);
  const [breathing] = useState(() => new Animated.Value(isPlaying ? 1 : RESTING));
  const [folding] = useState(() => new Animated.Value(0));
  const [swapping] = useState(() => new Animated.Value(1));
  const at = state.queue?.at ?? 0;
  const [shown, setShown] = useState({ id: track?.id ?? null, cover });
  const [leaving, setLeaving] = useState<{ id: string; cover: string | null } | null>(null);
  const leavingId = leaving?.id ?? null;
  const isFolded = beside !== 'nothing';
  const [besideShown, setBesideShown] = useState(beside);
  const [besideLeaving, setBesideLeaving] = useState<'queue' | 'lyrics' | null>(null);
  const [switching] = useState(() => new Animated.Value(1));
  const [position] = useState(() => new Animated.Value(at));
  const [lastAt] = useState(() => new Map<'at', number>([['at', at]]));
  const queue = state.queue;

  /**
   * The song a step away in the order it plays, going round where the queue repeats, and the place
   * it holds, so its cover can wait beside this one to be swiped in.
   *
   * @param step - One on, or one back.
   * @returns Where it is and its cover, or nothing where there is no song that way.
   */
  const songAt = (step: 1 | -1) => {
    if (queue === null) {
      return null;
    }

    const length = queue.order.length;
    const place = queue.at + step;
    const isRound = place < 0 || place >= length;

    if (isRound && (queue.repeat !== 'all' || length < 2)) {
      return null;
    }

    const found = queue.tracks[queue.order[(place + length) % length] ?? -1];

    return found === undefined
      ? null
      : {
          place: (place + length) % length,
          cover: found.album.hasArtwork ? onThisServer(albumArtworkUrl(found.album.id)) : null,
        };
  };
  const before = songAt(-1);
  const after = songAt(1);
  const [latest] = useState(
    () =>
      new Map<
        'now',
        {
          at: number;
          page: number;
          hasBefore: boolean;
          hasAfter: boolean;
          turn: (towards: 1 | -1) => void;
        }
      >(),
  );

  useEffect(() => {
    latest.set('now', {
      at,
      page: width * (isPlaying ? 1 : RESTING),
      hasBefore: before !== null,
      hasAfter: after !== null,
      turn: (towards) => {
        const now = player.read().queue;

        if (towards === 1) {
          player.next();
        } else if (now !== null && now.at > 0) {
          player.jumpTo(now.at - 1);
        } else {
          player.previous();
        }
      },
    });
  });

  const [turning] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
      onPanResponderMove: (_, gesture) => {
        const now = latest.get('now');

        if (now === undefined) {
          return;
        }

        const canGo = gesture.dx < 0 ? now.hasAfter : now.hasBefore;

        position.setValue(now.at - (canGo ? gesture.dx : gesture.dx * HELD_BACK) / now.page);
      },
      onPanResponderRelease: (_, gesture) => {
        const now = latest.get('now');
        const towards = (gesture.dx === 0 ? gesture.vx : gesture.dx) < 0 ? 1 : -1;
        const canGo = towards === 1 ? now?.hasAfter === true : now?.hasBefore === true;
        const isTurning =
          now !== undefined &&
          canGo &&
          (Math.abs(gesture.dx) > now.page * TURNS_PAST ||
            Math.abs(gesture.vx) > TURNS_FASTER_THAN);

        if (!isTurning) {
          Animated.spring(position, {
            ...SPRINGS.liquid,
            toValue: now?.at ?? 0,
            useNativeDriver: true,
          }).start();

          return;
        }

        Animated.timing(position, {
          toValue: now.at + towards,
          duration: TURNS_IN_MS,
          easing: EASINGS.outCubic,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            now.turn(towards);
          }
        });
      },
      onPanResponderTerminate: () => {
        Animated.spring(position, {
          ...SPRINGS.liquid,
          toValue: latest.get('now')?.at ?? 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  );
  const shift = isStill ? 0 : SWITCH_SHIFT * (besideShown === 'queue' ? 1 : -1);
  const besideComesIn = useMemo(
    () =>
      folding.interpolate({
        inputRange: [0.4, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [folding],
  );
  const switchedAway = useMemo(
    () => switching.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    [switching],
  );
  const switchLeaves = useMemo(
    () => switching.interpolate({ inputRange: [0, 1], outputRange: [0, -shift] }),
    [switching, shift],
  );
  const switchArrives = useMemo(
    () => switching.interpolate({ inputRange: [0, 1], outputRange: [shift, 0] }),
    [switching, shift],
  );
  const coverAcross = useMemo(
    () => folding.interpolate({ inputRange: [0, 1], outputRange: [(across - side) / 2, 0] }),
    [folding, across, side],
  );
  const slides = useMemo(() => {
    const placed = (index: number) => Animated.multiply(Animated.subtract(index, position), width);

    return { before: placed(at - 1), current: placed(at), after: placed(at + 1) };
  }, [position, width, at]);
  const coverScale = useMemo(
    () => folding.interpolate({ inputRange: [0, 1], outputRange: [1, SMALL / side] }),
    [folding, side],
  );
  const swappedAway = useMemo(
    () => swapping.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    [swapping],
  );
  const seek = useCallback(
    (to: number) => {
      player.seek(to);
    },
    [player],
  );

  if (besideShown !== beside) {
    if (besideShown !== 'nothing' && beside !== 'nothing') {
      setBesideLeaving(besideShown);
    }

    setBesideShown(beside);
  }

  if (track !== null && shown.id !== track.id) {
    if (shown.id !== null) {
      setLeaving({ id: shown.id, cover: shown.cover });
    }

    setShown({ id: track.id, cover });
  }

  useLayoutEffect(() => {
    const was = lastAt.get('at') ?? at;

    lastAt.set('at', at);

    if (Math.abs(at - was) === 1 && !isStill && !isFolded) {
      Animated.spring(position, { ...FOLDS, toValue: at }).start();
    } else {
      position.setValue(at);
    }
  }, [at, isFolded, isStill, lastAt, position]);

  useLayoutEffect(() => {
    if (leavingId === null) {
      return;
    }

    if (isStill) {
      setLeaving(null);

      return;
    }

    swapping.setValue(0);
    Animated.spring(swapping, { ...FOLDS, toValue: 1 }).start(({ finished }) => {
      if (finished) {
        setLeaving((was) => (was?.id === leavingId ? null : was));
      }
    });
  }, [leavingId, isStill, swapping]);

  useLayoutEffect(() => {
    if (besideLeaving === null) {
      return;
    }

    switching.setValue(0);
    Animated.spring(switching, { ...FOLDS, toValue: 1 }).start(({ finished }) => {
      if (finished) {
        setBesideLeaving((was) => (was === besideLeaving ? null : was));
      }
    });
  }, [besideLeaving, switching]);

  useEffect(() => {
    const toValue = isPlaying ? 1 : RESTING;

    if (isStill) {
      breathing.setValue(toValue);

      return;
    }

    Animated.spring(breathing, { ...BREATHES, toValue }).start();
  }, [isPlaying, isStill, breathing]);

  useEffect(() => {
    const toValue = isFolded ? 1 : 0;

    if (isStill) {
      folding.setValue(toValue);

      return;
    }

    Animated.spring(folding, { ...FOLDS, toValue }).start();
  }, [isFolded, isStill, folding]);

  if (track === null) {
    return (
      <Screen centres onBack={onBack} goesBackDown>
        <Words tone="muted" isCentred>
          Nothing is playing.
        </Words>
      </Screen>
    );
  }

  const isLiked = favourites.isKept(track.id);
  const repeat = state.queue?.repeat ?? 'off';
  const shuffling = shuffleModeOf(state.queue);
  const sounds = howTheFileSounds(track, (state.playingQuality ?? state.quality) === 'lossless');
  const firstArtist = track.artists[0];

  /**
   * Draws a cover, or a note where there is none.
   *
   * @param of - The cover's address.
   * @returns It.
   */
  const drawCover = (of: string | null) => (
    <View
      style={[
        styles.floating,
        { backgroundColor: colours.surfaceRaised, height: side, width: side },
      ]}
    >
      <View style={[styles.art, { height: side, width: side }]}>
        {of === null ? (
          <Icon of={MusicNote} size={80} colour={colours.textMuted} />
        ) : (
          <Image style={styles.fills} source={{ uri: of }} accessibilityIgnoresInvertColors />
        )}
      </View>
    </View>
  );

  const liking = (
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
          of={isLiked ? HeartFilled : Heart}
          size={26}
          colour={isLiked ? colours.danger : colours.text}
        />
      </View>
    </Button>
  );

  const naming = (
    <View style={styles.said}>
      <Words size="heading" lines={isFolded ? 1 : 2}>
        {track.title}
      </Words>
      <Button
        tone="bare"
        label={`Open ${firstArtist?.name ?? 'the artist'}`}
        onPress={() => {
          if (firstArtist !== undefined) {
            onArtist(firstArtist.id);
          }
        }}
      >
        <Words tone="muted" lines={1}>
          {track.artists.map((artist) => artist.name).join(', ')}
        </Words>
      </Button>
    </View>
  );

  return (
    <Screen onBack={onBack} goesBackDown behind={<AMoodBackground palette={lights} />}>
      <View
        style={styles.top}
        onLayout={({ nativeEvent }) => {
          setTopHigh(nativeEvent.layout.height);
        }}
      >
        {isFolded ? (
          <>
            <View style={styles.head}>
              <Button
                tone="bare"
                label="Show the cover"
                onPress={() => {
                  setBeside('nothing');
                }}
              >
                <View style={{ height: SMALL, width: SMALL }} />
              </Button>
              {naming}
              {liking}
            </View>
            <Animated.View style={[styles.beside, { opacity: besideComesIn }]}>
              {[...(besideLeaving === null ? [] : [besideLeaving]), besideShown].map((which) => {
                const isLeaving = which === besideLeaving;

                return (
                  <Animated.View
                    key={which}
                    pointerEvents={isLeaving ? 'none' : 'auto'}
                    style={[
                      isLeaving ? StyleSheet.absoluteFill : styles.beside,
                      {
                        opacity: isLeaving ? switchedAway : switching,
                        transform: [{ translateX: isLeaving ? switchLeaves : switchArrives }],
                      },
                    ]}
                  >
                    {which === 'queue' ? (
                      <TheUpNext />
                    ) : (
                      <TheLyrics trackId={track.id} onSeek={seek} />
                    )}
                  </Animated.View>
                );
              })}
            </Animated.View>
          </>
        ) : (
          <>
            <View {...turning.panHandlers}>
              <Button
                tone="bare"
                label={`Open ${track.album.title}`}
                onPress={() => {
                  onAlbum(track.album.id);
                }}
              >
                <View style={{ height: side }} />
              </Button>
            </View>
            <View style={styles.head}>
              {naming}
              {liking}
            </View>
          </>
        )}

        {topHigh === 0 ? null : (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cover,
              {
                transform: [{ translateX: coverAcross }, { scale: coverScale }],
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: breathing }] }}>
              {leaving === null || !isFolded ? null : (
                <Animated.View
                  key="leaving"
                  style={[StyleSheet.absoluteFill, { opacity: swappedAway }]}
                >
                  {drawCover(leaving.cover)}
                </Animated.View>
              )}
              {isFolded || before === null ? null : (
                <Animated.View
                  key={`at-${before.place.toString()}`}
                  style={[StyleSheet.absoluteFill, { transform: [{ translateX: slides.before }] }]}
                >
                  {drawCover(before.cover)}
                </Animated.View>
              )}
              <Animated.View
                key={`at-${at.toString()}`}
                style={
                  isFolded ? { opacity: swapping } : { transform: [{ translateX: slides.current }] }
                }
              >
                {drawCover(cover)}
              </Animated.View>
              {isFolded || after === null ? null : (
                <Animated.View
                  key={`at-${after.place.toString()}`}
                  style={[StyleSheet.absoluteFill, { transform: [{ translateX: slides.after }] }]}
                >
                  {drawCover(after.cover)}
                </Animated.View>
              )}
            </Animated.View>
          </Animated.View>
        )}
      </View>

      <View style={styles.foot}>
        <ThePlaceInTheSong title={track.title}>
          {sounds === null ? null : (
            <Button
              tone="bare"
              label={`${sounds}, what it is`}
              onPress={() => {
                Alert.alert(sounds, whatTheFileHolds(track));
              }}
            >
              <View style={[styles.badge, { borderColor: withAlpha(colours.text, 0.35) }]}>
                <Words size="small" tone="muted">
                  {sounds}
                </Words>
              </View>
            </Button>
          )}
        </ThePlaceInTheSong>

        <View style={styles.controls}>
          <Button
            tone="bare"
            label={SHUFFLE_LABELS[shuffling]}
            isChosen={shuffling !== 'off'}
            onPress={() => player.cycleShuffle()}
          >
            <AShuffleMark mode={shuffling} size={20} />
          </Button>

          <Button tone="bare" label="Previous" onPress={() => player.previous()}>
            <View style={styles.reach}>
              <Icon of={SkipBackFilled} size={32} colour={colours.text} />
            </View>
          </Button>

          <Button tone="bare" label={isPlaying ? 'Pause' : 'Play'} onPress={() => player.toggle()}>
            <View style={styles.reach}>
              <Icon of={isPlaying ? PauseFilled : PlayFilled} size={52} colour={colours.text} />
            </View>
          </Button>

          <Button tone="bare" label="Next" onPress={() => player.next()}>
            <View style={styles.reach}>
              <Icon of={SkipForwardFilled} size={32} colour={colours.text} />
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
            <ALitCircle
              of={repeat === 'one' ? Repeat1 : Repeat}
              size={20}
              isLit={repeat !== 'off'}
            />
          </Button>
        </View>

        <AVolumeSlider />

        <View style={styles.extras}>
          <Button
            tone="bare"
            label="Words"
            isChosen={beside === 'lyrics'}
            onPress={() => {
              setBeside((was) => (was === 'lyrics' ? 'nothing' : 'lyrics'));
            }}
          >
            <ALitCircle of={Mic} size={20} isLit={beside === 'lyrics'} />
          </Button>

          <AirPlayButton />

          <Button
            tone="bare"
            label={
              state.remote === null ? 'Play on another device' : `Playing on ${state.remote.label}`
            }
            isChosen={state.remote !== null}
            onPress={() => {
              setIsChoosingDevice(true);
            }}
          >
            <ALitCircle of={Cast} size={20} isLit={state.remote !== null} />
          </Button>

          <Button
            tone="bare"
            label="Up next"
            isChosen={beside === 'queue'}
            onPress={() => {
              setBeside((was) => (was === 'queue' ? 'nothing' : 'queue'));
            }}
          >
            <ALitCircle of={ListMusic} size={20} isLit={beside === 'queue'} />
          </Button>
        </View>

        {state.remote === null ? null : (
          <Words size="small" tone="muted" isCentred>
            {`Playing on ${state.remote.label}`}
          </Words>
        )}

        {state.problem === null ? null : <Words tone="danger">{state.problem}</Words>}

        <ADevicesSheet
          isOpen={isChoosingDevice}
          onClose={() => {
            setIsChoosingDevice(false);
          }}
        />
      </View>
    </Screen>
  );
};

TheMusicPlayer.displayName = 'TheMusicPlayer';

export { TheMusicPlayer };
