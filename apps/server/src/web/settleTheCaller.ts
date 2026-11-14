import type { Context, MiddlewareHandler } from 'hono';
import { CALLER_HEADER } from '@ValenceServer/web/CALLER_HEADER';

/**
 * Puts the caller's address, as this server works it out, in the one header the sign-in service
 * reads it from, before anything else reads the request, so that no handler hands on an address the
 * caller wrote themselves. The request's headers are changed in place rather than the request
 * copied, so a large upload is never read into memory to do it.
 *
 * @param callerOf - Works out the caller's address, or nothing where it cannot be told.
 * @returns The middleware.
 */
const settleTheCaller =
  (callerOf: (context: Context) => string | null): MiddlewareHandler =>
  async (context, next) => {
    const address = callerOf(context);

    if (address === null) {
      context.req.raw.headers.delete(CALLER_HEADER);
    } else {
      context.req.raw.headers.set(CALLER_HEADER, address);
    }

    await next();
  };

export { settleTheCaller };
