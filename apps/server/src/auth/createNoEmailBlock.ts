import { createMiddleware } from 'hono/factory';
import { z } from 'zod';
import { refuse } from '@ValenceI18n/refuse';
import { realEmailOf } from '@ValenceContracts/functions/realEmailOf';

const AddressedSchema = z
  .object({ email: z.string().optional(), newEmail: z.string().optional() })
  .partial();

/**
 * Turns away any sign-in request that names the placeholder address an account without a real one
 * holds, so it can never be signed in with, reset, signed up with or changed to. The server's own
 * sign-in by a face reaches better-auth directly and is not stopped here.
 *
 * @returns The middleware.
 */
const createNoEmailBlock = () =>
  createMiddleware(async (context, next) => {
    if (context.req.method === 'POST') {
      const body = await context.req.raw
        .clone()
        .json()
        .catch(() => null);
      const read = AddressedSchema.safeParse(body);
      const named = read.success ? [read.data.email, read.data.newEmail] : [];

      if (named.some((address) => address !== undefined && realEmailOf(address) === null)) {
        return context.json(refuse('error.account.thatAddressCannotBeUsed'), 400);
      }
    }

    await next();

    return undefined;
  });

export { createNoEmailBlock };
