import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
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
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { WatchingProps } from './Watching.types';
import type { VideoSource, VideoView as VideoViewRef } from 'expo-video';

const SAY_IT_IS_ALIVE_EVERY = 30_000;

const LOOK_EVERY = 1000;

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
 * It goes full screen of its own accord and leaving it is leaving the film, which is how a video
 * opens everywhere else on a phone. Nobody pressing play on a film wants a small picture in the
 * middle of a page and a second button to press before it fills the screen. What is behind it is
 * drawn anyway, so a phone that refuses to go full screen still plays rather than showing black.
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
  const clientId = platformInUse().thisClientId();

  useEffect(() => {
    let started: string | null = null;
    let leftAlready = false;

    void startPlaybackSession(mediaId, thePhonesProfile(), clientId, Math.floor(startSeconds)).then(
      (outcome) => {
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

          setSeekTo(whole ? startSeconds : 0);
          setSessionId(wasStarted);
          setSource(cookie === null ? { uri } : { uri, headers: { Cookie: cookie } });
        });
      },
    );

    return () => {
      leftAlready = true;

      if (started !== null) {
        void stopPlaybackSession(started, clientId);
      }

      void stopWatching(clientId);
    };
  }, [mediaId, startSeconds, clientId]);

  const player = useVideoPlayer(source, (ready) => {
    if (seekTo > 0) {
      ready.currentTime = seekTo;
    }

    ready.play();
  });

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
    if (source === null) {
      return;
    }

    void picture.current?.enterFullscreen();
  }, [source]);

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
        <Words tone="muted">Asking the server for this one…</Words>
      </Screen>
    );
  }

  return (
    <View style={styles.picture}>
      <VideoView
        ref={picture}
        style={styles.picture}
        player={player}
        allowsPictureInPicture
        nativeControls
        contentFit="contain"
        onFullscreenExit={onDone}
      />
      <Button tone="quiet" onPress={onDone}>
        Done
      </Button>
    </View>
  );
};

Watching.displayName = 'Watching';

export { Watching };
