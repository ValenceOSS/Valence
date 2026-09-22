import { useEffect, useState } from 'react';
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
import { Button } from '@ValencePhone/components/Button/Button';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { WatchingProps } from './Watching.types';

const SAY_IT_IS_ALIVE_EVERY = 30_000;

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
 * Where somebody is picking up part way, the server is asked to start there and a whole file is
 * seeked to instead: a transcode begins at the segment they asked for, while a file sent untouched
 * begins where every file does.
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
  const [address, setAddress] = useState<string | null>(null);
  const [seekTo, setSeekTo] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
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

        setSeekTo(whole ? startSeconds : 0);
        setSessionId(started);
        setAddress(
          onThisServer(
            outcome.session.delivery.kind === 'direct'
              ? outcome.session.delivery.url
              : outcome.session.delivery.manifestUrl,
          ),
        );
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

  const player = useVideoPlayer(address, (ready) => {
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
    if (sessionId === null) {
      return;
    }

    const bookmark = (isLeaving: boolean) => {
      if (player.duration <= 0) {
        return;
      }

      void reportWatchProgress(
        mediaId,
        { positionSeconds: player.currentTime, durationSeconds: player.duration },
        { isLeaving },
      );
    };

    const saving = setInterval(() => {
      bookmark(false);
    }, REPORT_EVERY_MILLISECONDS);

    return () => {
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

  if (address === null) {
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
        style={styles.picture}
        player={player}
        allowsPictureInPicture
        nativeControls
        contentFit="contain"
      />
      <Button tone="quiet" onPress={onDone}>
        Done
      </Button>
    </View>
  );
};

Watching.displayName = 'Watching';

export { Watching };
