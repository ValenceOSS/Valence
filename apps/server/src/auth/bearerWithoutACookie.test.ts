import { describe, expect, it } from 'vitest';
import { createMemoryAuth } from './createMemoryAuth';
import { carriesASessionCookie } from './bearerWithoutACookie';

const BASE_URL = 'http://localhost:8420';

const asking = (cookie: string) => ({ headers: new Headers({ cookie }) });

describe('carriesASessionCookie', () => {
  it('sees the session cookie a browser signs in with', () => {
    expect(carriesASessionCookie(asking('better-auth.session_token=abc.def'))).toBe(true);
  });

  it('sees it under the prefix a server behind tls gives it', () => {
    expect(
      carriesASessionCookie(asking('theme=dark; __Secure-better-auth.session_token=abc')),
    ).toBe(true);
  });

  it('sees no session in cookies that are not one', () => {
    expect(carriesASessionCookie(asking('theme=dark; valence.profile=x'))).toBe(false);
  });

  it('sees no session where no cookie was sent at all', () => {
    expect(carriesASessionCookie({ headers: new Headers() })).toBe(false);
  });

  it('reads the request itself where the library hands that over instead', () => {
    const request = new Request(BASE_URL, { headers: { cookie: 'better-auth.session_token=a' } });

    expect(carriesASessionCookie({ request })).toBe(true);
  });
});

describe('bearerWithoutACookie', () => {
  it('never copies a new session into a header the page could read', async () => {
    const { auth } = createMemoryAuth();

    const signedUp = await auth.handler(
      new Request(`${BASE_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: BASE_URL },
        body: JSON.stringify({
          name: 'Marques',
          email: 'marques@valence.test',
          password: 'a-long-enough-password',
        }),
      }),
    );

    expect(signedUp.status).toBe(200);
    expect(signedUp.headers.get('set-auth-token')).toBeNull();
  });
});
