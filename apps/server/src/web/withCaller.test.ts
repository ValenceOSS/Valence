import { describe, expect, it } from 'vitest';
import { withCaller } from './withCaller';
import { CALLER_HEADER } from './CALLER_HEADER';

describe('withCaller', () => {
  it('replaces whatever the caller wrote with the address this server worked out', async () => {
    const sent = new Request('http://valence.test/api/auth/sign-in/email', {
      method: 'POST',
      headers: { [CALLER_HEADER]: '198.51.100.1', 'content-type': 'application/json' },
      body: '{"email":"a@b.test"}',
    });

    const handed = await withCaller(sent, '203.0.113.7');

    expect(handed.headers.get(CALLER_HEADER)).toBe('203.0.113.7');
    expect(handed.headers.get('content-type')).toBe('application/json');
    expect(handed.method).toBe('POST');
    expect(handed.url).toBe('http://valence.test/api/auth/sign-in/email');
    expect(await handed.text()).toBe('{"email":"a@b.test"}');
  });

  it('removes what the caller wrote where the address is not known', async () => {
    const sent = new Request('http://valence.test/api/auth/get-session', {
      headers: { [CALLER_HEADER]: '198.51.100.1' },
    });

    expect((await withCaller(sent, null)).headers.get(CALLER_HEADER)).toBeNull();
  });
});
