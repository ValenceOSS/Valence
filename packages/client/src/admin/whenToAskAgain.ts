import { REENCODES_STILL_TO_BE_WRITTEN } from '@ValenceContracts/schemas/Reencode';
import type { Reencode } from '@ValenceContracts/schemas/Reencode';

const ENCODING_EVERY_MS = 2000;

/**
 * How long to wait before asking about the re-encoding queue again, or nothing to stop asking.
 *
 * An encode reports its progress by writing it down rather than by announcing it, so a page that
 * asked once shows the bar where it stood when the page opened and only moves when somebody
 * reloads. Asking again while anything is still being written is what makes the bar a bar.
 *
 * And only while. A queue that has been empty since Tuesday is not worth a request every two
 * seconds, and what remains in it — encodes waiting for somebody to judge them — changes only when
 * somebody judges one, which is a thing they do on this very page.
 *
 * @param reencodes - The queue as it was last read.
 * @returns The wait in milliseconds, or false to stop asking.
 */
const whenToAskAgain = (reencodes: readonly Reencode[]): number | false =>
  reencodes.some((one) => REENCODES_STILL_TO_BE_WRITTEN.some((waiting) => waiting === one.state))
    ? ENCODING_EVERY_MS
    : false;

export { ENCODING_EVERY_MS, whenToAskAgain };
