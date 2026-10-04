import { discordLookOf } from '@ValenceScreens/playback/discordLookOf';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WhatIsBeingWatched } from '@ValenceScreens/desktop/theDesktopShell';

const A_SECOND = 1000;

type WatchingStatusOf = {
  media: Pick<MediaSummary, 'title'> &
    Partial<
      Pick<
        MediaSummary,
        'seriesTitle' | 'seasonNumber' | 'episodeNumber' | 'externalId' | 'posterUrl'
      >
    > & { durationSeconds?: number };
  positionSeconds: number;
  isPlaying: boolean;
  party: { id: string; size: number } | null;
  settings: DiscordPresence;
  now: number;
};

/**
 * What Discord is told about a film or episode being watched, from where it has got to.
 *
 * It is said as when it would have started had it been played straight through, and when it would
 * end: Discord draws the bar between the two, so it reads as a place in the film rather than as
 * time spent looking at it.
 *
 * @param of - What is playing, how far in, whether it is, the party it is in, the profile's Discord
 *   settings, and the time now in milliseconds.
 * @returns The status for the window to publish.
 */
const theWatchingStatus = ({
  media,
  positionSeconds,
  isPlaying,
  party,
  settings,
  now,
}: WatchingStatusOf): WhatIsBeingWatched => {
  const {
    title,
    seriesTitle,
    seasonNumber,
    episodeNumber,
    externalId,
    posterUrl,
    durationSeconds,
  } = media;
  const isSeries = typeof seriesTitle === 'string' && seriesTitle !== '';
  const startedAt = now - Math.max(Math.round(positionSeconds), 0) * A_SECOND;
  const runs =
    typeof durationSeconds === 'number' && durationSeconds > 0 ? Math.round(durationSeconds) : null;

  return {
    kind: 'watching',
    title,
    series: isSeries ? seriesTitle : null,
    season: typeof seasonNumber === 'number' ? seasonNumber : null,
    episode: typeof episodeNumber === 'number' ? episodeNumber : null,
    startedAt,
    endsAt: runs === null ? null : startedAt + runs * A_SECOND,
    tmdbId: typeof externalId === 'string' && externalId !== '' ? externalId : null,
    isSeries,
    isPaused: !isPlaying,
    artwork: typeof posterUrl === 'string' && posterUrl !== '' ? posterUrl : null,
    party,
    look: discordLookOf(settings),
  };
};

export type { WatchingStatusOf };

export { theWatchingStatus };
