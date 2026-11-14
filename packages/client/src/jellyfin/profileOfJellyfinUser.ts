import { PROFILE_COLOURS, ViewerProfileSchema } from '@ValenceContracts/schemas/ViewerProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { JellyfinIdBook } from '@ValenceClient/jellyfin/createJellyfinIdBook';
import type { JellyfinUser } from '@ValenceClient/jellyfin/JellyfinSchemas';

const SOMETIME = '2026-01-01T00:00:00.000Z';

/**
 * The Jellyfin user somebody signed in as, as the one profile on their account: a Jellyfin user
 * watches as nobody but themselves, has no PIN Valence could ask for, and asks for nothing.
 *
 * @param user - The Jellyfin user.
 * @param book - How identifiers are turned.
 * @returns The profile.
 */
const profileOfJellyfinUser = (user: JellyfinUser, book: JellyfinIdBook): ViewerProfile =>
  ViewerProfileSchema.parse({
    id: book.valenceIdOf(user.Id),
    name: user.Name,
    colour: PROFILE_COLOURS[0],
    avatar: { kind: 'initial' },
    isOwner: true,
    hasPin: false,
    mayRequest: false,
    createdAt: SOMETIME,
    updatedAt: SOMETIME,
  });

export { profileOfJellyfinUser };
