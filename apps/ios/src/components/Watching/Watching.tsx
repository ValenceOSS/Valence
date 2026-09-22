import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { useEvent } from 'expo';
import { useQuery } from '@tanstack/react-query';
import { useVideoPlayer, VideoView } from 'expo-video';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import {
  heartbeatPlaybackSession,
  sendPresenceHeartbeat,
  startPlaybackSession,
  stopPlaybackSession,
  stopWatching,
} from '@ValenceClient/playback/startPlaybackSession';
import {
  REPORT_EVERY_MILLISECONDS,
  reportWatchProgress,
} from '@ValenceClient/playback/watchProgress';
import { thePhonesProfile } from '@ValencePhone/playback/thePhonesProfile';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValencePhone/platform/theCookiesThisPhoneHolds';
import { holdThisPhoneUpright } from '@ValencePhone/platform/holdThisPhoneUpright';
import { turnThisPhoneSideways } from '@ValencePhone/platform/turnThisPhoneSideways';
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { TheControls } from '@ValencePhone/components/Watching/components/TheControls/TheControls';
import { TheChoices } from '@ValencePhone/components/Watching/components/TheChoices/TheChoices';
import { howBigToDrawIt } from '@ValencePhone/components/Watching/howBigToDrawIt';
import { usePinchToFill } from '@ValencePhone/components/Watching/usePinchToFill';
import { theChoicesOn } from '@ValencePhone/components/Watching/theChoicesOn';
import type { WatchingProps } from './Watching.types';
import type { VideoSource, VideoView as VideoViewRef } from 'expo-video';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';

const SAY_IT_IS_ALIVE_EVERY = 30_000;

const LOOK_EVERY = 1000;

const LEAVE_THEM_UP_FOR = 3500;

const FADING_IN = 160;

const FADING_OUT = 240;

const ZOOMING = 220;

const HOW_OFTEN_IT_SAYS_WHERE_IT_IS = 0.25;

const styles = StyleSheet.create({
  picture: { backgroundColor: '#000000', flex: 1 },
});

/**
 * Watching one title.
 *
 * The stream is negotiated before anything is drawn, because what the server sends back is the
 * answer to what this phone said it could take — and the address to play is not known until it has.
 *
 * Whatever comes back is handed to the system's own player rather than driven from here. It is the
 * thing on this platform that knows about picture-in-picture, the lock screen and the route the
 * sound is going out by, and reimplementing any of that in JavaScript would be worse at all three.
 *
 * This is the one screen a phone is turned for, and it turns itself: almost everything a household
 * watches was shot wide, and a phone held upright shows it as a strip across the middle.
 *
 * Whether the controls are wanted and whether they are still drawn are two questions: they are let
 * go of once the fade has had time to finish, rather than when it says it has. The fade is run off
 * the main thread so it does not stutter against a playing film, and a thing running over there
 * cannot be waited on over here.
 *
 * Two fingers pushed apart fill the screen with the picture and drawn together fit it inside,
 * which is what a pinch does to a video everywhere else on a phone. Fitted means inside everything
 * the phone has put over its screen, not merely letterboxed: the whole reason somebody pinches a
 * film smaller is to get the cutout off it, and a picture that still runs under the cutout has not
 * done the one thing it was asked. Filled gives that up on purpose in exchange for the bands.
 *
 * The gesture is taken before the picture sees it, so a second finger never also counts as a tap
 * and brings the controls up.
 *
 * It fills the screen from the moment it opens, and its controls are Valence's own rather than the
 * system's. The system's are good but they are a closed box: nothing can be drawn over them and
 * nothing added to them, and a subtitle track or a quality this server can send is a thing they
 * have never heard of. They also show nothing to pick between, because what this server sends is
 * one rendition with one sound on it.
 *
 * It is handed this phone's cookies with it. Everything else on here is asked for through the
 * system's own networking, which attaches them; the player builds its own requests and is not told
 * to consult the jar, so without this a film is asked for by somebody the server does not know.
 *
 * Where somebody is picking up part way, the server is asked to start there and a whole file is
 * seeked to instead: a transcode begins at the segment they asked for, while a file sent untouched
 * begins where every file does.
 *
 * Where they have got to is sampled every second and written down every ten, and the last sample
 * is what goes down on the way out rather than a fresh reading: the player is released before this
 * screen's own tidying runs, so asking it anything then is asking a thing that is already gone.
 *
 * The session is ended on the way out, including where they left before the server had finished
 * answering. A session left open is a transcode still running on somebody's server for a film
 * nobody is watching.
 *
 * @param mediaId - What to watch.
 * @param startSeconds - Where to begin.
 * @param onDone - Told they have stopped watching.
 */
const Watching = ({ mediaId, startSeconds = 0, onDone }: WatchingProps) => {
  const colours = useTheColours();
  const [source, setSource] = useState<VideoSource | null>(null);
  const [seekTo, setSeekTo] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const whereTheyGotTo = useRef<{ positionSeconds: number; durationSeconds: number } | null>(null);
  const picture = useRef<VideoViewRef | null>(null);
  const [areControlsUp, setAreControlsUp] = useState(true);
  const [areControlsDrawn, setAreControlsDrawn] = useState(true);
  const [fade] = useState(() => new Animated.Value(1));
  const { howClose, pinching } = usePinchToFill();
  const room = useSafeAreaInsets();
  const [screen, setScreen] = useState({ width: 0, height: 0 });
  const [howBig] = useState(() => new Animated.Value(1));
  const [lastTouched, setLastTouched] = useState(0);
  const [isChoosing, setIsChoosing] = useState(false);
  const [asking, setAsking] = useState<{
    from: number;
    audioStreamIndex?: number;
    requestedQuality?: QualityPreference;
  }>({ from: startSeconds });
  const clientId = platformInUse().thisClientId();
  const title = useQuery(libraryQueries.detail(mediaId));

  useEffect(() => {
    let started: string | null = null;
    let leftAlready = false;

    setSource(null);

    void startPlaybackSession(
      mediaId,
      thePhonesProfile(),
      clientId,
      Math.floor(asking.from),
      asking.audioStreamIndex,
      asking.requestedQuality,
    ).then((outcome) => {
      if (outcome.kind === 'failed') {
        setRefusal(outcome.reason);

        return;
      }

      started = outcome.session.sessionId;

      if (leftAlready) {
        void stopPlaybackSession(started, clientId);

        return;
      }

      const whole = outcome.session.delivery.kind === 'direct';
      const uri = onThisServer(
        outcome.session.delivery.kind === 'direct'
          ? outcome.session.delivery.url
          : outcome.session.delivery.manifestUrl,
      );
      const wasStarted = started;

      void theCookiesThisPhoneHolds(uri).then((cookie) => {
        if (leftAlready) {
          return;
        }

        setSeekTo(whole ? asking.from : 0);
        setSessionId(wasStarted);
        setSource(cookie === null ? { uri } : { uri, headers: { Cookie: cookie } });
      });
    });

    return () => {
      leftAlready = true;

      if (started !== null) {
        void stopPlaybackSession(started, clientId);
      }

      void stopWatching(clientId);
    };
  }, [mediaId, asking, clientId]);

  const player = useVideoPlayer(source, (ready) => {
    ready.timeUpdateEventInterval = HOW_OFTEN_IT_SAYS_WHERE_IT_IS;
    ready.showNowPlayingNotification = true;
    ready.staysActiveInBackground = true;

    if (seekTo > 0) {
      ready.currentTime = seekTo;
    }

    ready.play();
  });

  const moving = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const ticking = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    bufferedPosition: player.bufferedPosition,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
  });

  const keepThemUp = useCallback(() => {
    setAreControlsUp(true);
    setLastTouched(Date.now());
  }, []);

  const askAgain = useCallback(
    (changed: { audioStreamIndex?: number; requestedQuality?: QualityPreference }) => {
      setIsChoosing(false);
      setAsking((asked) => ({ ...asked, ...changed, from: player.currentTime }));
    },
    [player],
  );

  useEffect(() => {
    if (sessionId === null) {
      return;
    }

    const beat = setInterval(() => {
      void heartbeatPlaybackSession(sessionId, player.playing, clientId);
      void sendPresenceHeartbeat(clientId, player.playing);
    }, SAY_IT_IS_ALIVE_EVERY);

    return () => {
      clearInterval(beat);
    };
  }, [sessionId, clientId, player]);

  useEffect(() => {
    void turnThisPhoneSideways();

    return () => {
      void holdThisPhoneUpright();
    };
  }, []);

  useEffect(() => {
    Animated.timing(howBig, {
      toValue: howBigToDrawIt(howClose, screen, room),
      duration: ZOOMING,
      useNativeDriver: true,
    }).start();
  }, [howClose, screen, room, howBig]);

  useEffect(() => {
    if (areControlsUp) {
      setAreControlsDrawn(true);
    }

    Animated.timing(fade, {
      toValue: areControlsUp ? 1 : 0,
      duration: areControlsUp ? FADING_IN : FADING_OUT,
      useNativeDriver: true,
    }).start();

    if (areControlsUp) {
      return;
    }

    const gone = setTimeout(() => {
      setAreControlsDrawn(false);
    }, FADING_OUT);

    return () => {
      clearTimeout(gone);
    };
  }, [areControlsUp, fade]);

  useEffect(() => {
    if (!areControlsUp || !moving.isPlaying || isChoosing) {
      return;
    }

    const going = setTimeout(() => {
      setAreControlsUp(false);
    }, LEAVE_THEM_UP_FOR);

    return () => {
      clearTimeout(going);
    };
  }, [areControlsUp, moving.isPlaying, isChoosing, lastTouched]);

  useEffect(() => {
    if (sessionId === null) {
      return;
    }

    const looking = setInterval(() => {
      if (player.duration > 0) {
        whereTheyGotTo.current = {
          positionSeconds: player.currentTime,
          durationSeconds: player.duration,
        };
      }
    }, LOOK_EVERY);

    const bookmark = (isLeaving: boolean) => {
      const seen = whereTheyGotTo.current;

      if (seen !== null) {
        void reportWatchProgress(mediaId, seen, { isLeaving });
      }
    };

    const saving = setInterval(() => {
      bookmark(false);
    }, REPORT_EVERY_MILLISECONDS);

    return () => {
      clearInterval(looking);
      clearInterval(saving);
      bookmark(true);
    };
  }, [sessionId, mediaId, player]);

  if (refusal !== null) {
    return (
      <Screen centres>
        <Words tone="danger">{refusal}</Words>
        <Button tone="quiet" onPress={onDone}>
          Back
        </Button>
      </Screen>
    );
  }

  if (source === null) {
    return (
      <Screen centres>
        <ActivityIndicator color={colours.textMuted} />
      </Screen>
    );
  }

  return (
    <View
      style={styles.picture}
      onLayout={({ nativeEvent }) => {
        setScreen(nativeEvent.layout);
      }}
      {...pinching.panHandlers}
    >
      <Animated.View style={[styles.picture, { transform: [{ scale: howBig }] }]}>
        <VideoView
          ref={picture}
          style={styles.picture}
          player={player}
          allowsPictureInPicture
          nativeControls={false}
          contentFit="contain"
        />
      </Animated.View>

      <Button
        tone="bare"
        fills
        label={areControlsUp ? 'Hide the controls' : 'Show the controls'}
        onPress={() => {
          setAreControlsUp((up) => !up);
        }}
      />

      {areControlsDrawn ? (
        <TheControls
          fade={fade}
          title={title.data?.title ?? ''}
          year={title.data?.year ?? null}
          isPlaying={moving.isPlaying}
          at={ticking.currentTime}
          runsFor={player.duration}
          buffered={ticking.bufferedPosition}
          onPlayPause={() => {
            keepThemUp();

            if (moving.isPlaying) {
              player.pause();
            } else {
              player.play();
            }
          }}
          onSkip={(by) => {
            keepThemUp();
            player.seekBy(by);
          }}
          onSeek={(to) => {
            keepThemUp();
            player.seekBy(to - ticking.currentTime);
          }}
          onTouched={keepThemUp}
          onClose={onDone}
          onSettings={() => {
            setIsChoosing(true);
          }}
        />
      ) : null}

      {isChoosing ? (
        <TheChoices
          sets={theChoicesOn({
            streams: title.data?.audioStreams ?? [],
            media: title.data ?? null,
            chosenAudio: asking.audioStreamIndex ?? null,
            chosenQuality: asking.requestedQuality ?? 'original',
            onAudio: (audioStreamIndex) => {
              askAgain({ audioStreamIndex });
            },
            onQuality: (requestedQuality) => {
              askAgain({ requestedQuality });
            },
          })}
          onClose={() => {
            setIsChoosing(false);
            keepThemUp();
          }}
        />
      ) : null}
    </View>
  );
};

Watching.displayName = 'Watching';

export { Watching };
