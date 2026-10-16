import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { hashSecret } from '@ValenceServer/locks/hashSecret';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

const PIN = z.string().regex(/^\d{4,8}$/u);

const NewChildSchema = z.object({
  name: z.string().trim().min(1).max(60),
  pin: PIN.nullable().default(null),
});

const ChildPinSchema = z.object({ pin: PIN.nullable() });

/**
 * Registers a parent's own children's accounts: listing them, adding one, and setting the PIN each
 * signs in with. What each may watch and up to what age is decided through the same routes an
 * administrator uses, which let a parent through for their own children.
 *
 * A child cannot add children of their own, and nobody but a child's parent may change their PIN.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveChildren = (app: OpenAPIHono, context: AppContext): void => {
  const { readAccount, children, listUsers, createAccountWithoutPassword } = context;

  const childrenOf = async (ownerId: string) => {
    const held = await children.list(ownerId);
    const names = new Map(
      ((await listUsers?.()) ?? []).map((account) => [account.id, account.name]),
    );

    return held.map((child) => ({
      id: child.userId,
      name: names.get(child.userId) ?? '',
      hasPin: child.hasPin,
    }));
  };

  app.get('/api/account/children', async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return context.json({ children: await childrenOf(account.id) }, 200);
  });

  app.post('/api/account/children', async (context) => {
    const account = await readAccount(context.req.raw.headers);

    if (account === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    if (
      (await children.ownerOf(account.id)) !== null ||
      createAccountWithoutPassword === undefined
    ) {
      return context.json(refuse('error.children.childrenCannotAddChildren'), 403);
    }

    const body = JsonValueSchema.safeParse(await context.req.json().catch(() => null));
    const asked = NewChildSchema.safeParse(body.success ? body.data : null);

    if (!asked.success) {
      return context.json(refuse('error.children.thatChildCouldNotBeRead'), 400);
    }

    const made = await createAccountWithoutPassword({ name: asked.data.name, by: account.id });

    if (made.kind !== 'created') {
      return context.json(refuse('error.children.theAccountCouldNotBeMade'), 409);
    }

    await children.adopt(account.id, made.userId);

    if (asked.data.pin !== null) {
      await children.setPinHash(made.userId, hashSecret(asked.data.pin));
    }

    return context.json({ children: await childrenOf(account.id) }, 200);
  });

  app.put('/api/account/children/:userId/pin', async (context) => {
    const account = await readAccount(context.req.raw.headers);
    const userId = context.req.param('userId');

    if (account === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    if ((await children.ownerOf(userId)) !== account.id) {
      return context.json(refuse('error.children.thatIsNotYourChild'), 403);
    }

    const body = JsonValueSchema.safeParse(await context.req.json().catch(() => null));
    const asked = ChildPinSchema.safeParse(body.success ? body.data : null);

    if (!asked.success) {
      return context.json(refuse('error.children.thatPinCouldNotBeRead'), 400);
    }

    await children.setPinHash(userId, asked.data.pin === null ? null : hashSecret(asked.data.pin));

    return context.json({ children: await childrenOf(account.id) }, 200);
  });
};

export { serveChildren };
