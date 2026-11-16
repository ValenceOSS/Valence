/* oxlint-disable valence/no-hard-coded-strings -- written to the server's log, which stays English */
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { EngineFault } from '@ValenceContracts/schemas/EngineFault';
import type { PlaybackNote } from '@ValenceContracts/schemas/PlaybackNote';

const WHILE: Readonly<Record<EngineFault['stage'], string>> = {
  opening: 'failing to open the file',
  decoding: 'failing to decode the picture',
  drawing: 'losing the graphics card it drew with',
  refused: 'the browser refusing what it was given',
  repackaging: 'failing to repackage the file',
  seeking: 'failing to start again after a seek',
};

/**
 * Says in the server log what a player put right by itself, which leaves no other trace on the
 * server: a recovery where it was, a watch party jumping it to where the room is, or its engine
 * handing a film to the server, and why.
 *
 * @param note - What the player put right.
 * @param client - The device it happened on, by name.
 * @returns The line for the log.
 */
const describeTheNote = (note: PlaybackNote, client: string): string => {
  if (note.kind === 'recovered') {
    return `Playback recovered by itself at ${formatDuration(note.atSeconds)} for ${client}`;
  }

  if (note.kind === 'engineHandedOver') {
    const said = note.detail === null ? '' : `: ${note.detail}`;

    return `The player's engine handed ${client} to the server at ${formatDuration(note.atSeconds)}, ${WHILE[note.stage]}${said}`;
  }

  const why = note.because === 'joined' ? 'on joining' : 'after drifting';

  return `Watch party ${note.partyId} moved ${client} from ${formatDuration(note.fromSeconds)} to ${formatDuration(note.toSeconds)}, ${why}`;
};

export { describeTheNote };
