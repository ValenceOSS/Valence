import { useEffect, useRef } from 'react';
import { onPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { reportNowWatching } from '@ValenceClient/video/videoDevices';
import type {
  VideoNowWatching,
  VideoSetting,
  VideoSettingChoices,
} from '@ValenceContracts/schemas/VideoRemote';

const REPORTS_EVERY_MS = 10_000;

const SETTLES_MS = 400;

const STOPS_AFTER_MS = 1_500;

let stopping: ReturnType<typeof setTimeout> | null = null;

type Controlled = {
  mediaId: string;
  title: string;
  subtitle: string | null;
  hasBackdrop: boolean;
  isPlaying: boolean;
  hasNext: boolean;
  stepsBy: VideoNowWatching['stepsBy'];
  canStepOn: boolean;
  canStepBack: boolean;
  settings: VideoSettingChoices[];
  skip: VideoNowWatching['skip'];
  read: () => { position: number; duration: number };
  onPause: () => void;
  onResume: () => void;
  onSeek: (seconds: number) => void;
  onNext: () => void;
  onStep: (toward: 'back' | 'on') => void;
  onChoose: (setting: VideoSetting, choiceId: string) => void;
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
    hasNext: controlled.hasNext,
    stepsBy: controlled.stepsBy,
    canStepOn: controlled.canStepOn,
    canStepBack: controlled.canStepBack,
    settings: controlled.settings,
    skip: controlled.skip,
    reportedAtMs: Date.now(),
  });
};

/**
 * Lets this person's other devices drive the film playing here, and keeps them told where it has
 * got to — what makes a phone a remote for the television.
 *
 * Another device's pause, play, move, next episode, step back or on through the episodes or the
 * chapters, choice of subtitles, sound, quality or speed, and stop reach the player, as do an
 * administrator's stop, pause and resume. What is playing is said straight away, again whenever it
 * pauses, plays, moves, or what can be chosen or skipped changes, and every few seconds between,
 * and the device says it has stopped once the player closes — a moment after, so going on to
 * another episode, which closes one player and opens the next, reads as one thing playing on rather
 * than a stop and a start.
 *
 * @param controlled - What is playing, whether an episode follows it, what can be chosen about it
 *   and skipped in it, what a step back or on moves through, and how to pause, play, move, go on to
 *   that episode, step, choose and stop it.
 */
const useRemoteControlled = (controlled: Controlled): void => {
  const latest = useRef(controlled);
  const {
    mediaId,
    title,
    subtitle,
    hasBackdrop,
    isPlaying,
    hasNext,
    stepsBy,
    canStepOn,
    canStepBack,
    settings,
    skip,
  } = controlled;
  const settingsSaid = JSON.stringify(settings);
  const skipLabel = skip?.label ?? null;
  const skipTo = skip?.toSeconds ?? null;

  useEffect(() => {
    latest.current = controlled;
  });

  useEffect(() => {
    let isClosed = false;
    const say = (): void => {
      if (!isClosed) {
        sayWhatIsPlaying(latest.current);
      }
    };

    if (stopping !== null) {
      clearTimeout(stopping);
      stopping = null;
    }

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
      } else if (command.kind === 'next') {
        now.onNext();

        return;
      } else if (command.kind === 'step') {
        now.onStep(command.toward);
      } else if (command.kind === 'choose') {
        now.onChoose(command.setting, command.choiceId);
      } else if (command.kind === 'stop') {
        now.onStop();

        return;
      }

      setTimeout(say, SETTLES_MS);
    });

    return () => {
      isClosed = true;
      clearInterval(timer);
      stopObeying();
    };
  }, [mediaId, title, subtitle, hasBackdrop]);

  useEffect(() => {
    sayWhatIsPlaying(latest.current);
  }, [
    isPlaying,
    hasNext,
    stepsBy,
    canStepOn,
    canStepBack,
    settingsSaid,
    skipLabel,
    skipTo,
    mediaId,
    title,
    subtitle,
    hasBackdrop,
  ]);

  useEffect(
    () => () => {
      stopping = setTimeout(() => {
        stopping = null;
        void reportNowWatching(null);
      }, STOPS_AFTER_MS);
    },
    [],
  );
};

export { useRemoteControlled };
