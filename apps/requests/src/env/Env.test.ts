import { describe, expect, it } from 'vitest';
import { readEnv } from './Env';

const A_SECRET = 'a-secret-long-enough-to-be-worth-keeping';

describe('readEnv', () => {
  it('applies defaults beside the secret', () => {
    const env = readEnv({ REQUESTS_SECRET: A_SECRET });

    expect(env.REQUESTS_PORT).toBe(8421);
    expect(env.VPN_URL).toBe('');
    expect(env.VPN_CHECK_SECONDS).toBe(30);
  });

  it('refuses to start without a secret the server shares', () => {
    expect(() => readEnv({})).toThrow();
  });

  it('refuses a secret too short to guard anything', () => {
    expect(() => readEnv({ REQUESTS_SECRET: 'short' })).toThrow();
  });

  it('drops a trailing slash from where the VPN answers', () => {
    expect(readEnv({ REQUESTS_SECRET: A_SECRET, VPN_URL: ' http://gluetun:8000/ ' }).VPN_URL).toBe(
      'http://gluetun:8000',
    );
  });

  it('coerces the port from a string, leaving the server’s own PORT alone', () => {
    const env = readEnv({ REQUESTS_SECRET: A_SECRET, REQUESTS_PORT: '9000', PORT: '8420' });

    expect(env.REQUESTS_PORT).toBe(9000);
  });
});
