import type { PlaylistOwner } from '@ValenceContracts/schemas/Playlist';
import { say } from '@ValenceI18n/say';

/**
 * What to call whoever a playlist belongs to, including when they are gone.
 *
 * A shared playlist outlives the profile that made it, so the household keeps what it was
 * listening to. Something still has to be written where the name was.
 *
 * @param owner - The profile it belongs to, or nothing where that profile has been removed.
 * @returns What to write.
 */
const nameOfOwner = (owner: PlaylistOwner | null): string =>
  owner?.name ?? say('screens.nameOfOwner.removedProfile');

export { nameOfOwner };
