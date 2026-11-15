/* oxlint-disable valence/no-hard-coded-strings -- written to the server's log, which stays English */
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { PlaybackMode } from '@ValenceContracts/functions/describePlaybackMode';
import type { PlaybackStartReason } from '@ValenceContracts/schemas/PlaybackStartReason';

const BECAUSE: Readonly<Record<PlaybackStartReason, string>> = {
  opened: 'opened',
  next: 'made ready as the next episode',
  quality: 'the quality changed',
  audio: 'the sound track changed',
  subtitles: 'the subtitles changed',
  cast: 'casting started or stopped',
  engine: "the player's engine handed over",
  converting: 'converting what would not play as it was',
  recovering: 'recovering from a failure',
  reconnected: 'the server came back',
  retried: 'the viewer tried again',
};

/**
 * Says in the server log that a stream started, where in the title, how, for which device and why,
 * so an admin reading a viewer's trouble back can tell a restart from the viewer opening it.
 *
 * @param start - Where it starts, how it is delivered, the device asking and why it asked.
 * @returns The line for the log.
 */
const describeTheStart = (start: {
  startSeconds: number;
  mode: PlaybackMode;
  client: string;
  startedBecause: PlaybackStartReason | undefined;
}): string => {
  const why = start.startedBecause === undefined ? '' : `: ${BECAUSE[start.startedBecause]}`;

  return `Playback started at ${formatDuration(start.startSeconds)} (${start.mode}) for ${start.client}${why}`;
};

export { describeTheStart };
