import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import { say } from '@ValenceI18n/say';

/**
 * How far through a transfer something is, as a fraction.
 *
 * Nothing rather than nought where the size is not known yet. A bar that sits at zero while bytes
 * are plainly arriving reads as stuck, and the honest thing to draw for a length nobody has been
 * told is a bar with no position at all.
 *
 * @param file - What is being kept.
 * @returns How much of it is here, or nothing where that cannot be said.
 */
const keptFraction = (file: HeldFile): number | null => {
  if (file.ofBytes === null || file.ofBytes === 0) {
    return null;
  }

  return Math.min(file.bytes / file.ofBytes, 1);
};

/**
 * Says what is happening to a file on this device, in the words somebody would use about it.
 *
 * Deliberately about this machine rather than about the server. The server preparing a rendition and
 * this laptop fetching it are two different waits that look identical on a progress bar, and
 * somebody wondering why their film is not here yet is owed the difference.
 *
 * @param file - What is being kept.
 * @returns The line beneath its title.
 */
const describeKeeping = (file: HeldFile): string => {
  const fraction = keptFraction(file);
  const done = fraction === null ? null : `${Math.round(fraction * 100).toString()}%`;

  if (file.state === 'failed') {
    return file.failure ?? say('core.describeKeeping.thatCouldNotBeFetchedTo');
  }

  if (file.state === 'paused') {
    return done === null
      ? say('core.describeKeeping.pausedAtBytesWhatIsHere', { bytes: formatBytes(file.bytes) })
      : say('core.describeKeeping.pausedAtDoneWhatIsHere', { done });
  }

  if (file.state === 'fetching') {
    const speed = file.bytesPerSecond === null ? '' : `, ${formatBytes(file.bytesPerSecond)}/s`;

    return done === null
      ? say('core.describeKeeping.fetchingBytesSoFarSpeed', {
          bytes: formatBytes(file.bytes),
          speed,
        })
      : say('core.describeKeeping.fetchingDoneSpeed', { done, speed });
  }

  return say('core.describeKeeping.onThisDeviceBytes', { bytes: formatBytes(file.bytes) });
};

export { describeKeeping, keptFraction };
