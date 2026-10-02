import { APIError, createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { z } from 'zod';
import type { BetterAuthPlugin } from 'better-auth';

const CREDENTIAL = 'credential';

const SecondFactorSchema = z.object({ twoFactorEnabled: z.boolean().nullish() });

/**
 * Lets the server finish setting an account up once its setup link has been checked and spent: it
 * gives the account the password its owner chose, if they chose one rather than a passkey, ends any
 * session it held, and signs its owner in. An account with a second factor is not signed in, since
 * a link is not a second factor; its owner signs in as usual with their new password.
 *
 * Reachable only from inside the server, never over the network, because it trusts that whoever
 * calls it has already checked the link.
 *
 * @returns The plugin.
 */
const finishSetup = () =>
  ({
    id: 'finish-setup',
    endpoints: {
      finishSetup: createAuthEndpoint.serverOnly(
        {
          method: 'POST',
          body: z.object({ userId: z.string().min(1), password: z.string().optional() }),
        },
        async (context) => {
          const { userId, password } = context.body;
          const { internalAdapter } = context.context;
          const found = await internalAdapter.findUserById(userId);

          if (found === null) {
            throw new APIError('NOT_FOUND');
          }

          if (password !== undefined) {
            const hash = await context.context.password.hash(password);
            const credential = await internalAdapter.findCredentialAccount(userId);

            if (credential === null) {
              await internalAdapter.linkAccount({
                userId,
                providerId: CREDENTIAL,
                accountId: userId,
                password: hash,
              });
            } else {
              await internalAdapter.updateAccount(credential.id, { password: hash });
            }
          }

          await internalAdapter.deleteUserSessions(userId);

          if (SecondFactorSchema.parse(found).twoFactorEnabled === true) {
            return context.json({ isSignedIn: false });
          }

          const session = await internalAdapter.createSession(userId);

          await setSessionCookie(context, { session, user: found });

          return context.json({ isSignedIn: true });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;

export { finishSetup };
