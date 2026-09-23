import {
  Cast,
  Heart,
  ListMusic,
  Mic,
  MusicNote,
  Repeat,
  Repeat1,
  Shuffle,
} from '@keyline-icons/react-native';
import {
  Heart as HeartFilled,
  Pause as PauseFilled,
  Play as PlayFilled,
  SkipBack as SkipBackFilled,
  SkipForward as SkipForwardFilled,
} from '@keyline-icons/react-native/fill';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Animated, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { howTheFileSounds } from '@ValenceClient/music/howTheFileSounds';
import { whatTheFileHolds } from '@ValenceClient/music/whatTheFileHolds';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { whichWayTheQueueMoved } from '@ValenceClient/music/whichWayTheQueueMoved';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { ALitCircle } from '@ValencePhone/components/ALitCircle/ALitCircle';
import { ADevicesSheet } from '@ValencePhone/components/ADevicesSheet/ADevicesSheet';
import { AirPlayButton } from '@ValencePhone/components/AirPlayButton/AirPlayButton';
import { AMoodBackground } from '@ValencePhone/components/AMoodBackground/AMoodBackground';
import { AVolumeSlider } from '@ValencePhone/components/AVolumeSlider/AVolumeSlider';
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
import { usePictureLights } from '@ValencePhone/hooks/usePictureLights';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { SPRINGS } from '@ValencePhone/theme/SPRINGS';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import type { TheMusicPlayerProps } from './TheMusicPlayer.types';

const RESTING = 0.86;

const SMALL = 64;

const TITLE_ROOM = 64;

const SWITCH_SHIFT = 32;

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
  lasts: { alignItems: 'flex-end' },
  time: { flex: 1 },
  times: { alignItems: 'center', flexDirection: 'row' },
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
  const position = whatIsPlaying?.positionSeconds ?? state.positionSeconds;
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
  const [shown, setShown] = useState({ id: track?.id ?? null, cover, at });
  const [leaving, setLeaving] = useState<{
    id: string;
    cover: string | null;
    way: 1 | -1;
  } | null>(null);
  const leavingId = leaving?.id ?? null;
  const isFolded = beside !== 'nothing';
  const [besideShown, setBesideShown] = useState(beside);
  const [besideLeaving, setBesideLeaving] = useState<'queue' | 'lyrics' | null>(null);
  const [switching] = useState(() => new Animated.Value(1));

  if (besideShown !== beside) {
    if (besideShown !== 'nothing' && beside !== 'nothing') {
      setBesideLeaving(besideShown);
    }

    setBesideShown(beside);
  }

  if (track !== null && shown.id !== track.id) {
    if (shown.id !== null) {
      setLeaving({
        id: shown.id,
        cover: shown.cover,
        way: whichWayTheQueueMoved(shown.at, at, state.queue?.order.length ?? 0),
      });
    }

    setShown({ id: track.id, cover, at });
  }

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
  const isShuffled = state.queue?.isShuffled ?? false;
  const sounds = howTheFileSounds(track, (state.playingQuality ?? state.quality) === 'lossless');
  const firstArtist = track.artists[0];
  const way = leaving?.way ?? 1;

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
            <Animated.View
              style={[
                styles.beside,
                {
                  opacity: folding.interpolate({
                    inputRange: [0.4, 1],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              {[...(besideLeaving === null ? [] : [besideLeaving]), besideShown].map((which) => {
                const isLeaving = which === besideLeaving;
                const shift = isStill ? 0 : SWITCH_SHIFT * (besideShown === 'queue' ? 1 : -1);

                return (
                  <Animated.View
                    key={which}
                    pointerEvents={isLeaving ? 'none' : 'auto'}
                    style={[
                      isLeaving ? StyleSheet.absoluteFill : styles.beside,
                      {
                        opacity: isLeaving
                          ? switching.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
                          : switching,
                        transform: [
                          {
                            translateX: switching.interpolate({
                              inputRange: [0, 1],
                              outputRange: isLeaving ? [0, -shift] : [shift, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {which === 'queue' ? (
                      <TheUpNext />
                    ) : (
                      <TheLyrics
                        trackId={track.id}
                        atSeconds={position}
                        onSeek={(to) => {
                          player.seek(to);
                        }}
                      />
                    )}
                  </Animated.View>
                );
              })}
            </Animated.View>
          </>
        ) : (
          <>
            <Button
              tone="bare"
              label={`Open ${track.album.title}`}
              onPress={() => {
                onAlbum(track.album.id);
              }}
            >
              <View style={{ height: side }} />
            </Button>
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
                transform: [
                  {
                    translateX: folding.interpolate({
                      inputRange: [0, 1],
                      outputRange: [(across - side) / 2, 0],
                    }),
                  },
                  {
                    scale: folding.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, SMALL / side],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: breathing }] }}>
              {leaving === null ? null : (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    isFolded
                      ? {
                          opacity: swapping.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0],
                          }),
                        }
                      : {
                          transform: [
                            {
                              translateX: swapping.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -way * width],
                              }),
                            },
                          ],
                        },
                  ]}
                >
                  {drawCover(leaving.cover)}
                </Animated.View>
              )}
              <Animated.View
                style={
                  isFolded
                    ? { opacity: swapping }
                    : {
                        transform: [
                          {
                            translateX: swapping.interpolate({
                              inputRange: [0, 1],
                              outputRange: [way * width, 0],
                            }),
                          },
                        ],
                      }
                }
              >
                {drawCover(cover)}
              </Animated.View>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      <View style={styles.foot}>
        <View>
          <Slider
            label={`Move through ${track.title}`}
            value={position}
            furthest={state.durationSeconds}
            colour={colours.text}
            restColour={withAlpha(colours.text, 0.2)}
            aheadColour={withAlpha(colours.text, 0.35)}
            onScrubbed={(to) => {
              player.seek(to);
            }}
          />
          <View style={styles.times}>
            <View style={styles.time}>
              <Words size="small" tone="muted">
                {asAClock(position)}
              </Words>
            </View>
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
            <View style={[styles.time, styles.lasts]}>
              <Words size="small" tone="muted">
                {`−${asAClock(Math.max(state.durationSeconds - position, 0))}`}
              </Words>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          <Button
            tone="bare"
            label="Shuffle"
            isChosen={isShuffled}
            onPress={() => player.toggleShuffle()}
          >
            <ALitCircle of={Shuffle} size={20} isLit={isShuffled} />
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
