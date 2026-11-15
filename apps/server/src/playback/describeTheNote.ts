/* oxlint-disable valence/no-hard-coded-strings -- written to the server's log, which stays English */
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { PlaybackNote } from '@ValenceContracts/schemas/PlaybackNote';

/**
 * Says in the server log what a player put right by itself, which leaves no other trace on the
 * server: a recovery where it was, or a watch party jumping it to where the room is.
 *
 * @param note - What the player put right.
 * @param client - The device it happened on, by name.
 * @returns The line for the log.
 */
const describeTheNote = (note: PlaybackNote, client: string): string => {
  if (note.kind === 'recovered') {
    return `Playback recovered by itself at ${formatDuration(note.atSeconds)} for ${client}`;
  }

  const why = note.because === 'joined' ? 'on joining' : 'after drifting';

  return `Watch party ${note.partyId} moved ${client} from ${formatDuration(note.fromSeconds)} to ${formatDuration(note.toSeconds)}, ${why}`;
};

export { describeTheNote };
