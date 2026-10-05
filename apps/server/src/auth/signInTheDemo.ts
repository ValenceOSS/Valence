import { APIError, createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { z } from 'zod';
import type { BetterAuthPlugin } from 'better-auth';

/**
 * Lets the server sign somebody in to a shared demo account without its password, since a demo's
 * whole point is that anybody may walk in: choosing its face is enough.
 *
 * Reachable only from inside the server, never over the network, because it trusts that whoever
 * calls it has already checked the account is one of the demo accounts the server names.
 *
 * @returns The plugin.
 */
const signInTheDemo = () =>
  ({
    id: 'sign-in-the-demo',
    endpoints: {
      signInTheDemo: createAuthEndpoint.serverOnly(
        { method: 'POST', body: z.object({ userId: z.string().min(1) }) },
        async (context) => {
          const { internalAdapter } = context.context;
          const found = await internalAdapter.findUserById(context.body.userId);

          if (found === null) {
            throw new APIError('NOT_FOUND');
          }

          const session = await internalAdapter.createSession(found.id);

          await setSessionCookie(context, { session, user: found });

          return context.json({ isSignedIn: true });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;

export { signInTheDemo };
