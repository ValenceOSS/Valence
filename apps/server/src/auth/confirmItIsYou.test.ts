import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { signUpForTest, TEST_ORIGIN } from '@ValenceServer/auth/signUpForTest';

const ConfirmationSchema = z.object({ isConfirmed: z.boolean() });

const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

/**
 * An account signed in two days ago, long enough that the library no longer calls its session fresh.
 */
const aSessionFromTwoDaysAgo = async () => {
  const { auth } = createMemoryAuth();
  const app = {
    request: async (input: string | Request, init?: RequestInit) =>
      auth.handler(new Request(input, init)),
  };
  const cookie = await signUpForTest(app);

  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + TWO_DAYS);

  const ask = (path: string, init: RequestInit = {}) =>
    app.request(`${TEST_ORIGIN}/api/auth${path}`, {
      ...init,
      headers: { origin: TEST_ORIGIN, cookie, 'content-type': 'application/json' },
    });

  const isConfirmed = async (): Promise<boolean> =>
    ConfirmationSchema.parse(await (await ask('/confirmation')).json()).isConfirmed;

  const confirm = (password: string) =>
    ask('/confirm-it-is-you', { method: 'POST', body: JSON.stringify({ password }) });

  return { ask, isConfirmed, confirm };
};

afterEach(() => {
  vi.useRealTimers();
});

describe('confirmItIsYou', () => {
  it('says a session signed in days ago is no longer confirmed', async () => {
    const { isConfirmed, ask } = await aSessionFromTwoDaysAgo();

    expect(await isConfirmed()).toBe(false);
    expect((await ask('/list-sessions')).status).toBe(403);
  });

  it('confirms it with the password, after which the library lets it do what it keeps for a fresh one', async () => {
    const { isConfirmed, confirm, ask } = await aSessionFromTwoDaysAgo();

    expect((await confirm('a-long-enough-password')).status).toBe(200);
    expect(await isConfirmed()).toBe(true);
    expect((await ask('/list-sessions')).status).toBe(200);
  });

  it('refuses the wrong password, and leaves the session as it was', async () => {
    const { isConfirmed, confirm } = await aSessionFromTwoDaysAgo();
    const refused = await confirm('not-the-password-at-all');

    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject({ message: 'Incorrect password.' });
    expect(await isConfirmed()).toBe(false);
  });

  it('asks who is confirming', async () => {
    const { auth } = createMemoryAuth();
    const response = await auth.handler(
      new Request(`${TEST_ORIGIN}/api/auth/confirm-it-is-you`, {
        method: 'POST',
        headers: { origin: TEST_ORIGIN, 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'anything-at-all' }),
      }),
    );

    expect(response.status).toBe(401);
  });
});
