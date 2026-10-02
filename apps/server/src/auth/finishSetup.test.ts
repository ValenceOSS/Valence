import { describe, expect, it } from 'vitest';
import { createMemoryAuth } from './createMemoryAuth';

const PASSWORD = 'a-long-enough-password';

/**
 * A memory authentication layer holding one account with no password.
 *
 * @returns The layer, its store and the account.
 */
const anAccount = async () => {
  const { auth, store } = createMemoryAuth();
  const { user } = await auth.api.createUser({
    body: {
      name: 'Ada',
      email: 'ada@no-email.invalid',
      data: { username: 'ada', displayUsername: 'ada' },
    },
  });

  return { auth, store, userId: user.id };
};

describe('finishSetup', () => {
  it('gives the account its password and signs its owner in', async () => {
    const { auth, userId } = await anAccount();

    const answer = await auth.api.finishSetup({
      body: { userId, password: PASSWORD },
      asResponse: true,
    });

    expect(await answer.json()).toEqual({ isSignedIn: true });
    expect(answer.headers.getSetCookie().length).toBeGreaterThan(0);
    await expect(
      auth.api.signInUsername({ body: { username: 'ada', password: PASSWORD } }),
    ).resolves.toMatchObject({ user: { id: userId } });
  });

  it('replaces a password the account already had', async () => {
    const { auth, userId } = await anAccount();

    await auth.api.finishSetup({ body: { userId, password: PASSWORD } });
    await auth.api.finishSetup({ body: { userId, password: 'another-long-password' } });

    await expect(
      auth.api.signInUsername({ body: { username: 'ada', password: 'another-long-password' } }),
    ).resolves.toMatchObject({ user: { id: userId } });
    await expect(
      auth.api.signInUsername({ body: { username: 'ada', password: PASSWORD } }),
    ).rejects.toThrow();
  });

  it('ends the sessions the account held before', async () => {
    const { auth, userId } = await anAccount();

    await auth.api.finishSetup({ body: { userId } });
    await auth.api.finishSetup({ body: { userId } });

    expect(await (await auth.$context).internalAdapter.listSessions(userId)).toHaveLength(1);
  });

  it('does not sign in an account with a second factor', async () => {
    const { auth, store, userId } = await anAccount();
    const held = store.user.find((one) => one.id === userId);

    if (held !== undefined) {
      Object.assign(held, { twoFactorEnabled: true });
    }

    const answer = await auth.api.finishSetup({
      body: { userId, password: PASSWORD },
      asResponse: true,
    });

    expect(await answer.json()).toEqual({ isSignedIn: false });
    expect(answer.headers.getSetCookie()).toEqual([]);
  });

  it('cannot be reached over the network', async () => {
    const { auth, userId } = await anAccount();

    const answer = await auth.handler(
      new Request('http://localhost:8420/api/auth/finish-setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:8420' },
        body: JSON.stringify({ userId }),
      }),
    );

    expect(answer.status).toBe(404);
  });
});
