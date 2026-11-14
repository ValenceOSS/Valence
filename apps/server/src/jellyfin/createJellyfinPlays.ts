import { randomBytes } from 'node:crypto';

type JellyfinPlay = {
  sessionId: string;
  mediaId: string;
  profileId: string;
  durationSeconds: number;
  ticket: string | null;
};

const MOST_PLAYS = 2000;

/**
 * The playback sessions Jellyfin apps started, by the play session identifier each app was handed,
 * so its reports of where it got to and its stop find the Valence session behind them. Held in
 * memory, since a Valence session ends with a restart anyway.
 *
 * @returns How to open, read and close one.
 */
const createJellyfinPlays = () => {
  const held = new Map<string, JellyfinPlay>();

  return {
    open: (play: JellyfinPlay): string => {
      if (held.size >= MOST_PLAYS) {
        const [oldest] = held.keys();

        if (oldest !== undefined) {
          held.delete(oldest);
        }
      }

      const id = randomBytes(16).toString('hex');

      held.set(id, play);

      return id;
    },
    read: (playSessionId: string, profileId: string): JellyfinPlay | null => {
      const play = held.get(playSessionId);

      return play === undefined || play.profileId !== profileId ? null : play;
    },
    close: (playSessionId: string): void => {
      held.delete(playSessionId);
    },
  };
};

type JellyfinPlays = ReturnType<typeof createJellyfinPlays>;

export type { JellyfinPlay, JellyfinPlays };

export { createJellyfinPlays };
