import {
  keepTheSessionToken,
  signedHeaders,
  signedHeadersFor,
  theSessionToken,
} from '@ValenceTv/platform/theSessionToken';

describe('theSessionToken in a browser', () => {
  it('keeps no token where the page could read it', () => {
    keepTheSessionToken('secret');

    expect(theSessionToken()).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });

  it('signs nothing itself, leaving it to the cookie', () => {
    keepTheSessionToken('secret');

    expect(signedHeaders()).toEqual({});
    expect(signedHeadersFor('/api/media/a-film/poster')).toEqual({});
  });
});
