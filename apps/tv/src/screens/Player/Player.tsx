import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVideoPlayer, VideoView } from 'expo-video';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import {
  REPORT_EVERY_MILLISECONDS,
  reportWatchProgress,
} from '@ValenceClient/playback/watchProgress';
import { FINISHED_WITHIN_SECONDS } from '@ValenceContracts/schemas/WatchProgress';
import { Button } from '@ValenceTv/components/Button/Button';
import { usePlaybackSession } from '@ValenceTv/playback/usePlaybackSession';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PlayerProps } from './Player.types';

/**
 * Plays a title across the whole screen with the television's own player, so the remote scrubs,
 * skips and pauses as it does in every other app, and the info panel shows what is on.
 *
 * Where this viewer is gets reported as they go and once more on leaving, so the front page's
 * Continue watching and every other screen with this title on it knows where they stopped. Reaching
 * the end counts it as watched and goes back to where they came from.
 *
 * Where the player is gets kept from its own events rather than asked of it, since the last report
 * is made as the screen closes, after the player itself has been let go.
 *
 * @param mediaId - What to play.
 * @param startSeconds - Where to start.
 * @param onLeave - Told when the title ends, or somebody gives up on it.
 */
const Player = ({ mediaId, startSeconds, onLeave }: PlayerProps) => {
  const cache = useQueryClient();
  const detail = useQuery(libraryQueries.detail(mediaId));
  const player = useVideoPlayer(null, (made) => {
    made.timeUpdateEventInterval = 1;
  });
  const at = useRef({ position: 0, duration: 0, isPlaying: false });
  const session = usePlaybackSession(mediaId, startSeconds, () => at.current.isPlaying);
  const leave = useRef(onLeave);

  useEffect(() => {
    const listening = [
      player.addListener('timeUpdate', ({ currentTime }) => {
        at.current.position = currentTime;
      }),
      player.addListener('sourceLoad', ({ duration }) => {
        at.current.duration = duration;
      }),
      player.addListener('playingChange', ({ isPlaying }) => {
        at.current.isPlaying = isPlaying;
      }),
    ];

    return () => {
      for (const listener of listening) {
        listener.remove();
      }
    };
  }, [player]);

  useEffect(() => {
    leave.current = onLeave;
  });

  const title = detail.data?.metadata.seriesTitle ?? detail.data?.title ?? '';
  const subtitle =
    detail.data?.metadata.seriesTitle === undefined || detail.data.metadata.seriesTitle === null
      ? undefined
      : detail.data.title;

  const isDescribed = !detail.isPending;

  useEffect(() => {
    if (session.kind !== 'ready' || !isDescribed) {
      return;
    }

    void player
      .replaceAsync({
        ...session.source,
        metadata: { title, ...(subtitle === undefined ? {} : { artist: subtitle }) },
      })
      .then(() => {
        if (startSeconds > 0) {
          player.currentTime = startSeconds;
        }

        player.play();
      });
  }, [session, isDescribed, player, startSeconds, title, subtitle]);

  useEffect(() => {
    if (session.kind !== 'ready') {
      return;
    }

    const report = (isFinished = false) => {
      const duration =
        at.current.duration > 0 ? at.current.duration : (detail.data?.durationSeconds ?? 0);
      const position = at.current.position;

      if (duration <= 0 || position <= 0) {
        return;
      }

      void reportWatchProgress(mediaId, {
        positionSeconds: position,
        durationSeconds: duration,
        isFinished: isFinished || position >= duration - FINISHED_WITHIN_SECONDS,
      }).then(() => cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey }));
    };

    const timer = setInterval(report, REPORT_EVERY_MILLISECONDS);
    const ended = player.addListener('playToEnd', () => {
      report(true);
      leave.current();
    });

    return () => {
      clearInterval(timer);
      ended.remove();
      report();
    };
  }, [session.kind, player, mediaId, detail.data?.durationSeconds, cache]);

  if (session.kind === 'failed') {
    return (
      <View style={styles.middle}>
        <Text style={styles.problem}>{session.reason}</Text>
        <Button label="Go back" variant="secondary" hasPreferredFocus onPress={onLeave} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        style={StyleSheet.absoluteFill}
      />

      {session.kind === 'starting' ? (
        <View style={[StyleSheet.absoluteFill, styles.middle]}>
          <ActivityIndicator size="large" color={tokens.colours.text} />
        </View>
      ) : null}
    </View>
  );
};

Player.displayName = 'Player';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.lg,
    backgroundColor: tokens.colours.canvas,
  },
  problem: { color: tokens.colours.text, fontSize: tokens.type.body, maxWidth: 1200 },
});

export { Player };
