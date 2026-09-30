import { createMiddleware } from 'hono/factory';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Closes better-auth's own administration endpoints, which would otherwise sit alongside Valence's and
 * answer to a different permission model than the rest of the server. Answers with where the real
 * ones are rather than with a bare refusal.
 */
const createBetterAuthAdminBlock = () =>
  createMiddleware((context) =>
    Promise.resolve(context.json(refuse('error.account.accountAdministrationIsAtApiAdmin'), 404)),
  );

export { createBetterAuthAdminBlock };
