import { createMiddleware } from 'hono/factory';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Closes better-auth's sign-up endpoints, so that nobody can make an account by asking for one.
 *
 * Accounts on a Valence are added by an administrator, as a person or through a setup link, and the
 * first one by first-run setup. All of those make the account from inside the server, which this
 * does not reach; only a request from outside does. There is deliberately no setting to open it
 * again: a server reachable from the internet would otherwise take an account from anybody who found
 * it, and on a fresh install whoever signed up first would stop setup from ever making the
 * administrator.
 *
 * @returns The middleware.
 */
const createSignUpBlock = () =>
  createMiddleware((context) =>
    Promise.resolve(context.json(refuse('error.account.accountsAreAddedByAnAdministrator'), 403)),
  );

export { createSignUpBlock };
