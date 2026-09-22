import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createMemoryAuth } from './createMemoryAuth';

const BASE_URL = 'http://localhost:8420';

const THIS_TELEVISION = 'valence-tv';

const GrantSchema = z.object({ device_code: z.string(), user_code: z.string() });

const TokenSchema = z.object({ access_token: z.string(), token_type: z.literal('Bearer') });

const SessionSchema = z.object({ user: z.object({ email: z.string() }) }).nullable();

const post = (path: string, body: Record<string, string>, headers: Record<string, string> = {}) =>
  new Request(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE_URL, ...headers },
    body: JSON.stringify(body),
  });

const readSession = (headers: Record<string, string>) =>
  new Request(`${BASE_URL}/api/auth/get-session`, { headers });

/**
 * Walks a television through signing in on a phone: the television asks for a code, somebody signed
 * in on the phone approves it, and the television asks again and is let in.
 *
 * @returns What the television was answered once it was let in.
 */
const handedOff = async () => {
  const { auth } = createMemoryAuth();

  const phone = await auth.handler(
    post('/api/auth/sign-up/email', {
      name: 'Marques',
      email: 'marques@valence.test',
      password: 'a-long-enough-password',
    }),
  );
  const phoneCookie = phone.headers.getSetCookie()[0]?.split(';')[0] ?? '';

  const grant = GrantSchema.parse(
    await (
      await auth.handler(post('/api/auth/device/code', { client_id: THIS_TELEVISION }))
    ).json(),
  );

  const claimed = await auth.handler(
    new Request(`${BASE_URL}/api/auth/device?user_code=${grant.user_code}`, {
      headers: { cookie: phoneCookie },
    }),
  );

  expect(claimed.status).toBe(200);

  const approved = await auth.handler(
    post('/api/auth/device/approve', { userCode: grant.user_code }, { cookie: phoneCookie }),
  );

  expect(approved.status).toBe(200);

  const letIn = await auth.handler(
    post('/api/auth/device/token', {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: grant.device_code,
      client_id: THIS_TELEVISION,
    }),
  );

  return { auth, letIn };
};

describe('signing a television in from a phone', () => {
  it('lets a browser television in with a session cookie, as it would any other sign-in', async () => {
    const { auth, letIn } = await handedOff();
    const cookie = letIn.headers.getSetCookie()[0]?.split(';')[0] ?? '';

    expect(cookie).toMatch(/session_token=/u);

    const session = SessionSchema.parse(await (await auth.handler(readSession({ cookie }))).json());

    expect(session?.user.email).toBe('marques@valence.test');
  });

  it('lets a native television in with the token it was handed, since it keeps no cookies', async () => {
    const { auth, letIn } = await handedOff();
    const { access_token: token } = TokenSchema.parse(await letIn.json());

    const session = SessionSchema.parse(
      await (await auth.handler(readSession({ authorization: `Bearer ${token}` }))).json(),
    );

    expect(session?.user.email).toBe('marques@valence.test');
  });

  it('is recognised by the routes behind the auth endpoints too, which ask the server directly', async () => {
    const { auth, letIn } = await handedOff();
    const { access_token: token } = TokenSchema.parse(await letIn.json());

    const session = await auth.api.getSession({
      headers: new Headers({ authorization: `Bearer ${token}` }),
    });

    expect(session?.user.email).toBe('marques@valence.test');
  });

  it('lets nobody in with a token that was never handed out', async () => {
    const { auth } = createMemoryAuth();

    const session = SessionSchema.parse(
      await (await auth.handler(readSession({ authorization: 'Bearer not-a-real-token' }))).json(),
    );

    expect(session).toBeNull();
  });
});
