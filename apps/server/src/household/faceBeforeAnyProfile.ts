import { STILL_WATCHING_DEFAULT } from '@ValenceContracts/schemas/StillWatching';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { fitProfileName } from './fitProfileName';
import type { Household } from '@ValenceContracts/schemas/Household';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * Draws an account that holds no profile yet as a face on the way in, under the id kept for it
 * there, so it can be chosen and signed in to before its first profile is made.
 *
 * @param wayInId - The id the account is known by on the way in, never the account's own.
 * @param face - The account's own name, colour and picture.
 * @param createdAt - When the account was made.
 * @returns The face, its name cut to what a profile may hold, with the address its picture is
 *   read from.
 */
const faceBeforeAnyProfile = (
  wayInId: string,
  face: Household,
  createdAt: string,
): ViewerProfile & { pictureUrl: string } => ({
  id: wayInId,
  name: fitProfileName(face.name),
  colour: face.colour,
  avatar: face.avatar,
  askStillWatchingAfter: STILL_WATCHING_DEFAULT,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  language: null,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt,
  updatedAt: face.updatedAt,
  pictureUrl: `/api/profiles/${wayInId}/household?v=${encodeURIComponent(face.updatedAt)}`,
});

export { faceBeforeAnyProfile };
