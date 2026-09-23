import { useEffect, useRef } from 'react';
import { onPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { reportNowWatching } from '@ValenceClient/video/videoDevices';

const REPORTS_EVERY_MS = 10_000;

const SETTLES_MS = 400;

type Controlled = {
  mediaId: string;
  title: string;
  subtitle: string | null;
  hasBackdrop: boolean;
  isPlaying: boolean;
  read: () => { position: number; duration: number };
  onPause: () => void;
  onResume: () => void;
  onSeek: (seconds: number) => void;
  onStop: () => void;
};

/**
 * Tells this person's other devices what is playing here and how far through it is.
 *
 * @param controlled - What is playing, and where it has got to.
 */
const sayWhatIsPlaying = (controlled: Controlled): void => {
  const { position, duration } = controlled.read();

  void reportNowWatching({
    mediaId: controlled.mediaId,
    title: controlled.title,
    subtitle: controlled.subtitle,
    hasBackdrop: controlled.hasBackdrop,
    positionSeconds: Math.max(position, 0),
    durationSeconds: Math.max(duration, 0),
    isPlaying: controlled.isPlaying,
    reportedAtMs: Date.now(),
  });
};

/**
 * Lets this person's other devices drive the film playing here, and keeps them told where it has
 * got to — what makes a phone a remote for the television.
 *
 * Another device's pause, play, move and stop reach the player, as do an administrator's stop, pause
 * and resume. What is playing is said straight away, again whenever it pauses, plays or moves, and
 * every few seconds between, and the device says it has stopped once the player closes.
 *
 * @param controlled - What is playing, and how to pause, play, move and stop it.
 */
const useRemoteControlled = (controlled: Controlled): void => {
  const latest = useRef(controlled);
  const { mediaId, title, subtitle, hasBackdrop, isPlaying } = controlled;

  useEffect(() => {
    latest.current = controlled;
  });

  useEffect(() => {
    const say = (): void => {
      sayWhatIsPlaying(latest.current);
    };

    say();

    const timer = setInterval(say, REPORTS_EVERY_MS);

    const stopObeying = onPresenceEvent((event) => {
      const now = latest.current;

      if (event.kind === 'stopped') {
        now.onStop();

        return;
      }

      if (event.kind === 'paused') {
        now.onPause();
        setTimeout(say, SETTLES_MS);

        return;
      }

      if (event.kind === 'resumed') {
        now.onResume();
        setTimeout(say, SETTLES_MS);

        return;
      }

      if (event.kind !== 'video') {
        return;
      }

      const { command } = event;

      if (command.kind === 'pause') {
        now.onPause();
      } else if (command.kind === 'resume') {
        now.onResume();
      } else if (command.kind === 'seek') {
        now.onSeek(command.positionSeconds);
      } else if (command.kind === 'skip') {
        now.onSeek(Math.max(now.read().position + command.seconds, 0));
      } else if (command.kind === 'stop') {
        now.onStop();

        return;
      }

      setTimeout(say, SETTLES_MS);
    });

    return () => {
      clearInterval(timer);
      stopObeying();
    };
  }, [mediaId, title, subtitle, hasBackdrop]);

  useEffect(() => {
    sayWhatIsPlaying({ ...latest.current, isPlaying });
  }, [isPlaying, mediaId, title, subtitle, hasBackdrop]);

  useEffect(
    () => () => {
      void reportNowWatching(null);
    },
    [],
  );
};

export { useRemoteControlled };
