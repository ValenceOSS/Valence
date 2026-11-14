import { describe, expect, it } from 'vitest';
import { valenceHeadersOf } from './valenceHeadersOf';
import { aJellyfinOrigin } from './testing/aJellyfinOrigin';

describe('valenceHeadersOf', () => {
  it('carries a session token as a bearer', () => {
    expect(valenceHeadersOf('s.abc', aJellyfinOrigin()).get('authorization')).toBe('Bearer abc');
  });

  it('carries an API key as Valence’s key header', () => {
    const headers = valenceHeadersOf('k.key', aJellyfinOrigin());

    expect(headers.get('x-api-key')).toBe('key');
    expect(headers.get('authorization')).toBeNull();
  });

  it('names the device from the app and its identifier, and passes the user agent on', () => {
    const headers = valenceHeadersOf(null, aJellyfinOrigin());

    expect(JSON.parse(decodeURIComponent(headers.get('x-valence-device') ?? ''))).toEqual({
      id: 'pixel8abcdef',
      name: 'Findroid · Pixel 8',
    });
    expect(headers.get('user-agent')).toBe('okhttp/4.12.0');
  });

  it('never passes on what the app says about who it is to Valence', () => {
    const headers = valenceHeadersOf(
      null,
      aJellyfinOrigin({
        headers: new Headers({ 'x-valence-caller': '1.2.3.4', cookie: 'a=b', authorization: 'x' }),
      }),
    );

    expect(headers.get('x-valence-caller')).toBeNull();
    expect(headers.get('cookie')).toBeNull();
    expect(headers.get('authorization')).toBeNull();
  });
});
