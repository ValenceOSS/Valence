import { describe, expect, it } from 'vitest';
import { isTheSeerrKey } from './isTheSeerrKey';

const KEY = '0123456789abcdef0123456789abcdef';

describe('isTheSeerrKey', () => {
  it('takes the key in the query, which is how Overseerr and Jellyseerr send it', () => {
    expect(
      isTheSeerrKey(new Request(`http://valence/arr/radarr/api/v3/tag?apikey=${KEY}`), KEY),
    ).toBe(true);
  });

  it('takes the key in the X-Api-Key header, as Radarr does', () => {
    const request = new Request('http://valence/arr/radarr/api/v3/tag', {
      headers: { 'X-Api-Key': KEY },
    });

    expect(isTheSeerrKey(request, KEY)).toBe(true);
  });

  it('refuses any other key', () => {
    expect(isTheSeerrKey(new Request('http://valence/x?apikey=nope'), KEY)).toBe(false);
  });

  it('refuses a request with no key', () => {
    expect(isTheSeerrKey(new Request('http://valence/x'), KEY)).toBe(false);
  });

  it('refuses everything while no key has been made', () => {
    expect(isTheSeerrKey(new Request('http://valence/x?apikey='), '')).toBe(false);
  });
});
