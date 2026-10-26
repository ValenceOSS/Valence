import {
  filesOfKeptListening,
  keptArtworkName,
} from '@ValenceClient/downloads/filesOfKeptListening';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { KeptListening, KeptListeningShelf } from '@ValenceContracts/schemas/KeptListening';

type KeptListeningStanding = {
  state: HeldFile['state'];
  filesHere: number;
  filesInAll: number;
  bytes: number;
  failure: string | null;
};

/**
 * How far a device has got with keeping an album, a playlist, liked songs or an audiobook,
 * counting its songs or tracks and not its artwork, which it plays without.
 *
 * @param shelf - What the device keeps.
 * @param kept - The thing asked about.
 * @param canPlay - Whether this device plays a kind of file.
 * @returns How it stands.
 */
const standingOfKeptListening = (
  shelf: KeptListeningShelf,
  kept: KeptListening,
  canPlay: (type: string) => boolean,
): KeptListeningStanding => {
  const artwork = keptArtworkName(kept);
  const names = new Set(
    filesOfKeptListening(kept, canPlay)
      .map((file) => file.name)
      .filter((name) => name !== artwork),
  );
  const files = shelf.files.filter((file) => names.has(file.name));
  const failed = files.find((file) => file.state === 'failed');
  const filesHere = files.filter((file) => file.state === 'here').length;

  return {
    state:
      filesHere === names.size
        ? 'here'
        : files.some((file) => file.state === 'fetching')
          ? 'fetching'
          : failed !== undefined
            ? 'failed'
            : 'paused',
    filesHere,
    filesInAll: names.size,
    bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    failure: failed?.failure ?? null,
  };
};

export type { KeptListeningStanding };

export { standingOfKeptListening };
