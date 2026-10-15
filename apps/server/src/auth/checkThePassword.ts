import { createAuthEndpoint } from 'better-auth/api';
import { z } from 'zod';
import type { BetterAuthPlugin } from 'better-auth';

/**
 * Lets the server ask whether a password is an account's, without signing anybody in or touching a
 * session — how the owner of an account proves it is them to set a profile PIN they have forgotten.
 *
 * Reachable only from inside the server, never over the network. A wrong password is still hashed
 * against where there is none to check, so an account without one answers no faster than any other.
 *
 * @returns The plugin.
 */
const checkThePassword = () =>
  ({
    id: 'check-the-password',
    endpoints: {
      checkThePassword: createAuthEndpoint.serverOnly(
        {
          method: 'POST',
          body: z.object({ userId: z.string().min(1), password: z.string().min(1) }),
        },
        async (context) => {
          const account = await context.context.internalAdapter.findCredentialAccount(
            context.body.userId,
          );
          const hash = account?.password ?? null;

          if (hash === null) {
            await context.context.password.hash(context.body.password);

            return context.json({ isRight: false });
          }

          return context.json({
            isRight: await context.context.password.verify({
              hash,
              password: context.body.password,
            }),
          });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;

export { checkThePassword };
