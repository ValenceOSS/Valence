import { createMiddleware } from 'hono/factory';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Keeps better-auth's one-time tokens out of reach over the network.
 *
 * The plugin publishes a way to make one and a way to spend one. Making one is a GET, which a link
 * on any page could send a signed-in browser to; spending one would let somebody who caught a code
 * skip the check that they also hold the secret it was issued against. Both are used, but only
 * from inside the server, where a phone signing in through a browser has been checked first.
 *
 * @returns The middleware.
 */
const createOneTimeTokenBlock = () =>
  createMiddleware((context) =>
    Promise.resolve(context.json(refuse('error.phone.aPhoneSignsInAtApi'), 404)),
  );

export { createOneTimeTokenBlock };
