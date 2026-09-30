import type { Said } from './SaidSchema';
import { sayAgain } from './sayAgain';

/**
 * Says again something a server may have said, or nothing where it said nothing.
 *
 * @param said - What the server said, if anything.
 */
const sayAgainIfAny = (said: Said | null | undefined): string | null =>
  said === null || said === undefined ? null : sayAgain(said);

export { sayAgainIfAny };
