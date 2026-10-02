import { randomUUID } from 'node:crypto';
import { eq, isNotNull } from 'drizzle-orm';
import { user } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import { NO_EMAIL_DOMAIN } from '@ValenceContracts/constants/NO_EMAIL_DOMAIN';
import { placeholderEmailOf } from '@ValenceServer/accounts/placeholderEmailOf';
import { deriveUsername } from '@ValenceServer/auth/deriveUsername';

type MakesUsers = {
  api: {
    createUser: (request: {
      body: {
        name: string;
        email: string;
        data: { username: string; displayUsername: string };
      };
    }) => Promise<{ user: { id: string } }>;
  };
};

type AccountMaker = {
  auth: MakesUsers;
  db: AnyValenceDatabase;
  onMade?: (userId: string, by: string | null) => void;
};

type AccountWithoutPasswordRequest = {
  name: string;
  username?: string;
  email?: string;
  by: string | null;
};

type AccountWithoutPasswordOutcome =
  | { kind: 'created'; userId: string }
  | { kind: 'taken'; field: 'username' | 'email' }
  | { kind: 'failed' };

/**
 * Makes an account nobody can sign in to yet: it has no password, and where no address was given it
 * holds a placeholder that is never shown, emailed or accepted at sign-in, so its setup link is the
 * only way in. Without a username it is given one from its address or name, which its owner may
 * change while setting it up. better-auth's own creation hook still runs, so it gets its profile and
 * default role.
 *
 * @param maker - The authentication layer that makes the account and the database it lives in.
 * @param request - Its name, any username or address already known, and who is adding it.
 * @returns The account made, which field was already taken, or that it could not be made.
 */
const createAccountWithoutPassword = async (
  maker: AccountMaker,
  request: AccountWithoutPasswordRequest,
): Promise<AccountWithoutPasswordOutcome> => {
  const username = request.username?.trim();
  const email = request.email?.trim().toLowerCase();

  if (username !== undefined && username !== '') {
    const [holder] = await maker.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username.toLowerCase()))
      .limit(1);

    if (holder !== undefined) {
      return { kind: 'taken', field: 'username' };
    }
  }

  if (email !== undefined && email !== '') {
    if (email.endsWith(`@${NO_EMAIL_DOMAIN}`)) {
      return { kind: 'failed' };
    }

    const [holder] = await maker.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (holder !== undefined) {
      return { kind: 'taken', field: 'email' };
    }
  }

  const hasEmail = email !== undefined && email !== '';
  const chosen =
    username === undefined || username === ''
      ? deriveUsername(
          { name: request.name, email: hasEmail ? email : placeholderEmailOf('') },
          new Set(
            (
              await maker.db
                .select({ username: user.username })
                .from(user)
                .where(isNotNull(user.username))
            ).flatMap((row) => (row.username === null ? [] : [row.username.toLowerCase()])),
          ),
        )
      : username;

  try {
    const { user: made } = await maker.auth.api.createUser({
      body: {
        name: request.name,
        email: hasEmail ? email : placeholderEmailOf(randomUUID()),
        data: { username: chosen, displayUsername: chosen },
      },
    });

    if (!hasEmail) {
      await maker.db
        .update(user)
        .set({ email: placeholderEmailOf(made.id) })
        .where(eq(user.id, made.id));
    }

    maker.onMade?.(made.id, request.by);

    return { kind: 'created', userId: made.id };
  } catch {
    return { kind: 'failed' };
  }
};

export type { AccountMaker, AccountWithoutPasswordOutcome, AccountWithoutPasswordRequest };

export { createAccountWithoutPassword };
