import { APIError, createAuthEndpoint, sessionMiddleware } from 'better-auth/api';
import { z } from 'zod';
import type { BetterAuthPlugin } from 'better-auth';
import { say } from '@ValenceI18n/say';

const CONFIRMATION = '/confirmation';

const CONFIRM_IT_IS_YOU = '/confirm-it-is-you';

const TRIES_A_MINUTE = 5;

/**
 * Lets somebody signed in a while ago prove it is still them, with their password, before doing what
 * the library keeps for a session signed in lately — adding a passkey is the one people meet.
 *
 * The library calls a session fresh for a day after it was signed in, and refuses such things once it
 * is not; a session lasts a month, so most people asking are refused. Worse, it refuses only after
 * the passkey was made, leaving one in somebody's passkey manager that the server never took. So a
 * client asks first whether this session is still fresh, and where it is not, asks for the password,
 * which makes it fresh again from the moment it is confirmed.
 *
 * Confirming is kept to a few tries a minute, because a session is exactly what somebody guessing at
 * a password they do not have would be holding. A wrong password is still hashed against where there
 * is none to check, so an account without one answers no faster than any other.
 *
 * @returns The plugin.
 */
const confirmItIsYou = () =>
  ({
    id: 'confirm-it-is-you',
    endpoints: {
      confirmation: createAuthEndpoint(
        CONFIRMATION,
        { method: 'GET', use: [sessionMiddleware] },
        async (context) => {
          const { freshAge } = context.context.sessionConfig;
          const signedInAt = new Date(context.context.session.session.createdAt).getTime();

          return context.json({
            isConfirmed: freshAge === 0 || Date.now() - signedInAt < freshAge * 1000,
          });
        },
      ),
      confirmItIsYou: createAuthEndpoint(
        CONFIRM_IT_IS_YOU,
        {
          method: 'POST',
          body: z.object({ password: z.string().min(1) }),
          use: [sessionMiddleware],
        },
        async (context) => {
          const { session, user } = context.context.session;
          const account = await context.context.internalAdapter.findCredentialAccount(user.id);
          const hash = account?.password ?? null;

          if (hash === null) {
            await context.context.password.hash(context.body.password);
          }

          const isRight =
            hash !== null &&
            (await context.context.password.verify({ hash, password: context.body.password }));

          if (!isRight) {
            throw new APIError('BAD_REQUEST', { message: say('common.thatIsNotYourPassword') });
          }

          await context.context.internalAdapter.updateSession(session.token, {
            createdAt: new Date(),
          });

          return context.json({ isConfirmed: true });
        },
      ),
    },
    rateLimit: [
      {
        pathMatcher: (path: string) => path === CONFIRM_IT_IS_YOU,
        window: 60,
        max: TRIES_A_MINUTE,
      },
    ],
  }) satisfies BetterAuthPlugin;

export { confirmItIsYou };
