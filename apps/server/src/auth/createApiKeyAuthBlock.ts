import { createMiddleware } from 'hono/factory';
import { refuse } from '@ValenceI18n/refuse';

const API_KEY_HEADER = 'x-api-key';

const WHAT_A_KEY_MAY_ASK = /^\/api\/auth\/get-session$/u;

/**
 * Keeps an API key out of better-auth's own endpoints, apart from asking whose session it is.
 *
 * better-auth turns a key into a session that was signed in this very moment, so every check that
 * asks for a recent sign-in passes, and nothing there knows what the key was narrowed to. A key made
 * only to read what is playing could otherwise list and end the account's sessions, register a
 * passkey or rename the account. A key is for Valence's own routes, where its permissions are what
 * is checked.
 *
 * @returns The middleware.
 */
const createApiKeyAuthBlock = () =>
  createMiddleware(async (context, next) => {
    if (
      context.req.header(API_KEY_HEADER) === undefined ||
      WHAT_A_KEY_MAY_ASK.test(context.req.path)
    ) {
      await next();

      return undefined;
    }

    return context.json(refuse('error.apiKey.aKeyCannotChangeHowItsAccount'), 403);
  });

export { createApiKeyAuthBlock };
