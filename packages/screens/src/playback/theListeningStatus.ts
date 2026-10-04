import { discordLookOf } from '@ValenceScreens/playback/discordLookOf';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';
import type { WhatIsBeingListened } from '@ValenceScreens/desktop/theDesktopShell';

const A_SECOND = 1000;

type ListeningStatusOf = {
  title: string;
  artists: string[];
  durationSeconds: number;
  positionSeconds: number;
  isPlaying: boolean;
  artwork: string | null;
  party: { id: string; size: number } | null;
  settings: DiscordPresence;
  now: number;
};

/**
 * What Discord is told about a track being listened to, from where it has got to, said the same way
 * as watching: when it would have started, and when it would end.
 *
 * @param of - The track, who made it, how long it is and how far in, whether it is playing, its
 *   cover, the listening party, the profile's Discord settings, and the time now in milliseconds.
 * @returns The status for the window to publish.
 */
const theListeningStatus = ({
  title,
  artists,
  durationSeconds,
  positionSeconds,
  isPlaying,
  artwork,
  party,
  settings,
  now,
}: ListeningStatusOf): WhatIsBeingListened => {
  const startedAt = now - Math.max(Math.round(positionSeconds), 0) * A_SECOND;
  const runs = durationSeconds > 0 ? Math.round(durationSeconds) : null;

  return {
    kind: 'listening',
    title,
    artists,
    startedAt,
    endsAt: runs === null ? null : startedAt + runs * A_SECOND,
    isPaused: !isPlaying,
    artwork,
    party,
    look: discordLookOf(settings),
  };
};

export type { ListeningStatusOf };

export { theListeningStatus };
