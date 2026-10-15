import { describe, expect, it } from 'vitest';
import { createMemoryAuth } from './createMemoryAuth';
import { checkThePassword } from './checkThePassword';
import { signUpForTest, TEST_ORIGIN } from './signUpForTest';

const PASSWORD = 'a-long-enough-password';

/**
 * An authentication layer holding one account with a password, and that account's identifier.
 *
 * @returns The layer, and whose account it holds.
 */
const anAccount = async () => {
  const memory = createMemoryAuth();

  await signUpForTest({
    request: (input, init) =>
      memory.auth.handler(
        typeof input === 'string' ? new Request(new URL(input, TEST_ORIGIN), init) : input,
      ),
  });

  return { ...memory, accountId: memory.store.user[0]?.id ?? '' };
};

describe('checkThePassword', () => {
  it('says the account’s own password is its password', async () => {
    const { auth, accountId } = await anAccount();

    await expect(
      auth.api.checkThePassword({ body: { userId: accountId, password: PASSWORD } }),
    ).resolves.toEqual({ isRight: true });
  });

  it('says somebody else’s guess is not', async () => {
    const { auth, accountId } = await anAccount();

    await expect(
      auth.api.checkThePassword({ body: { userId: accountId, password: 'not-the-password' } }),
    ).resolves.toEqual({ isRight: false });
  });

  it('says no for an account that has no password to check', async () => {
    const { auth } = await anAccount();

    await expect(
      auth.api.checkThePassword({ body: { userId: 'nobody', password: PASSWORD } }),
    ).resolves.toEqual({ isRight: false });
  });

  it('does not sign anybody in or hand out a session', async () => {
    const { auth, accountId, store } = await anAccount();
    const sessions = store.session.length;

    await auth.api.checkThePassword({ body: { userId: accountId, password: PASSWORD } });

    expect(store.session).toHaveLength(sessions);
  });

  it('is not reachable over the network', async () => {
    const { auth, accountId } = await anAccount();

    const response = await auth.handler(
      new Request(`${TEST_ORIGIN}/api/auth/check-the-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: TEST_ORIGIN },
        body: JSON.stringify({ userId: accountId, password: PASSWORD }),
      }),
    );

    expect(response.status).toBe(404);
  });

  it('refuses an empty password before checking anything', async () => {
    const { auth, accountId } = await anAccount();

    await expect(
      auth.api.checkThePassword({ body: { userId: accountId, password: '' } }),
    ).rejects.toThrow();
  });

  it('is a plugin with one endpoint', () => {
    expect(Object.keys(checkThePassword().endpoints)).toEqual(['checkThePassword']);
  });
});
