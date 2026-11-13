import type { MusicNowPlaying } from '@ValenceContracts/schemas/MusicRemote';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import type { PresenceService } from '@ValenceServer/presence/PresenceService';
import type { MusicDevices } from '@ValenceServer/music/createMusicDevices';
import { APP_CLIENT_PREFIX } from './APP_CLIENT_PREFIX';

type App = {
  appPasswordId: string;
  accountId: string;
  profileId: string;
  profileName: string;
  label: string;
};

type AppListening = {
  report: (app: App, track: MusicTrack | null) => void;
};

type AppListeningOptions = {
  presence: Pick<PresenceService, 'connect' | 'disconnect'>;
  devices: Pick<MusicDevices, 'report'>;
  now?: () => number;
  later?: (run: () => void, afterMs: number) => () => void;
};

const GRACE_MS = 60_000;

const MOST_LABEL_CHARACTERS = 60;

const FEWEST_MS_BETWEEN = 1000;

/**
 * Waits, and says how to stop waiting.
 *
 * @param run - What to do once the time is up.
 * @param afterMs - How long to wait.
 * @returns How to call it off.
 */
const wait = (run: () => void, afterMs: number): (() => void) => {
  const timer = setTimeout(run, afterMs);

  timer.unref();

  return () => {
    clearTimeout(timer);
  };
};

/**
 * Listening in an app outside Valence, signed in with an app password, shown as a device of the
 * person's own: it appears where their other devices do while a song plays, and goes once the song
 * would have ended, since such an app never says it stopped. It says what it plays at most once a
 * second. It can't be controlled, and its plays are counted by the app's own scrobble, never by the
 * device.
 *
 * @param options - The presence and music devices to appear in, and the clock.
 * @returns How an app says what it is playing.
 */
const createAppListening = ({
  presence,
  devices,
  now = Date.now,
  later = wait,
}: AppListeningOptions): AppListening => {
  const present = new Map<string, { stop: () => void; trackId: string; atMs: number }>();

  const leave = (clientId: string) => {
    const was = present.get(clientId);

    if (was === undefined) {
      return;
    }

    was.stop();
    present.delete(clientId);
    presence.disconnect(clientId, clientId);
  };

  return {
    report: (app, track) => {
      const clientId = `${APP_CLIENT_PREFIX}${app.appPasswordId}`;
      const was = present.get(clientId);
      const atMs = now();

      if (track === null) {
        leave(clientId);

        return;
      }

      if (was !== undefined && atMs - was.atMs < FEWEST_MS_BETWEEN) {
        return;
      }

      const owner = { accountId: app.accountId, profileId: app.profileId };

      if (was === undefined) {
        const label = app.label.trim().slice(0, MOST_LABEL_CHARACTERS);

        presence.connect({
          clientId,
          socketId: clientId,
          accountId: app.accountId,
          profileId: app.profileId,
          profileName: app.profileName,
          deviceLabel: label,
          send: () => undefined,
        });
      } else {
        was.stop();
      }

      const playing: MusicNowPlaying = {
        trackId: track.id,
        title: track.title,
        artists: track.artists.map((artist) => artist.name),
        albumId: track.album.id,
        hasArtwork: track.album.hasArtwork,
        positionSeconds: 0,
        durationSeconds: track.durationSeconds,
        isPlaying: true,
        volume: 1,
        isMuted: false,
        quality: track.isLossless ? 'lossless' : 'high',
        upNext: [],
        reportedAtMs: atMs,
      };

      devices.report(owner, clientId, playing);
      present.set(clientId, {
        stop: later(
          () => {
            leave(clientId);
          },
          track.durationSeconds * 1000 + GRACE_MS,
        ),
        trackId: track.id,
        atMs,
      });
    },
  };
};

export type { App, AppListening };

export { createAppListening };
