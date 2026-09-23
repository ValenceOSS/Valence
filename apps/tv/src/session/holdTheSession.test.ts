import { holdTheSession } from '@ValenceTv/session/holdTheSession';
import { theSessionToken } from '@ValenceTv/platform/theSessionToken';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

const answering = (status: number, body: string) =>
  jest.fn<Promise<Response>, [string | URL | Request, RequestInit | undefined]>(() =>
    Promise.resolve(new Response(body, { status })),
  );

describe('holdTheSession', () => {
  it('keeps a token a phone handed over, without asking', async () => {
    const asked = answering(200, 'null');

    globalThis.fetch = asked;

    await expect(holdTheSession('handed-over')).resolves.toBe(true);
    expect(theSessionToken()).toBe('handed-over');
    expect(asked).not.toHaveBeenCalled();
  });

  it('asks for the session a password sign-in opened, and keeps its token', async () => {
    const asked = answering(200, JSON.stringify({ session: { token: 'from-cookie' } }));

    globalThis.fetch = asked;

    await expect(holdTheSession()).resolves.toBe(true);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/auth/get-session');
    expect(theSessionToken()).toBe('from-cookie');
  });

  it('keeps nothing where there is no session', async () => {
    globalThis.fetch = answering(200, 'null');

    await expect(holdTheSession()).resolves.toBe(false);
    expect(theSessionToken()).toBeNull();
  });

  it('keeps nothing where the session cannot be read', async () => {
    globalThis.fetch = answering(500, '{}');

    await expect(holdTheSession()).resolves.toBe(false);
    expect(theSessionToken()).toBeNull();
  });
});
