import { NO_EMAIL_DOMAIN } from '@ValenceContracts/constants/NO_EMAIL_DOMAIN';
import type { JellyfinIdBook } from '@ValenceClient/jellyfin/createJellyfinIdBook';
import type { JellyfinUser } from '@ValenceClient/jellyfin/JellyfinSchemas';

const SOMETIME = '2026-01-01T00:00:00.000Z';

const LONG_AFTER = '2100-01-01T00:00:00.000Z';

/**
 * The session Valence's sign-in answers with, for somebody signed in to a Jellyfin server as one of
 * its users: they have a username and no email Valence knows, and the session lasts as long as
 * Jellyfin keeps the token.
 *
 * @param user - The Jellyfin user.
 * @param book - How identifiers are turned.
 * @returns The session and its user, as the sign-in service shapes them.
 */
const sessionOfJellyfinUser = (user: JellyfinUser, book: JellyfinIdBook) => {
  const id = book.valenceIdOf(user.Id);

  return {
    session: {
      id,
      userId: id,
      token: id,
      expiresAt: LONG_AFTER,
      createdAt: SOMETIME,
      updatedAt: SOMETIME,
    },
    user: {
      id,
      name: user.Name,
      email: `${id}@${NO_EMAIL_DOMAIN}`,
      username: user.Name,
      displayUsername: user.Name,
      emailVerified: true,
      image: null,
      role: user.Policy?.IsAdministrator === true ? 'admin' : 'user',
      twoFactorEnabled: false,
      createdAt: SOMETIME,
      updatedAt: SOMETIME,
    },
  };
};

export { sessionOfJellyfinUser };
