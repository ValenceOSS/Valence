import {
  keepTheSessionToken,
  signedHeaders,
  signedHeadersFor,
  theSessionToken,
} from '@ValenceTv/platform/theSessionToken';

describe('theSessionToken', () => {
  it('is nothing before the television has signed in', () => {
    expect(theSessionToken()).toBeNull();
    expect(signedHeaders()).toEqual({});
  });

  it('keeps the token a sign-in handed back and signs with it', () => {
    keepTheSessionToken('secret');

    expect(theSessionToken()).toBe('secret');
    expect(signedHeaders()).toEqual({ authorization: 'Bearer secret' });
  });

  it('forgets the token on the way out', () => {
    keepTheSessionToken('secret');
    keepTheSessionToken(null);

    expect(theSessionToken()).toBeNull();
  });

  it('treats an empty token as none', () => {
    keepTheSessionToken('');

    expect(theSessionToken()).toBeNull();
  });
});

describe('signedHeadersFor', () => {
  it('signs a request to this Valence', () => {
    keepTheSessionToken('secret');

    expect(signedHeadersFor('/api/music/albums/1/artwork')).toEqual({
      authorization: 'Bearer secret',
    });
  });

  it('never sends the session anywhere else', () => {
    keepTheSessionToken('secret');

    expect(signedHeadersFor('https://image.tmdb.org/a.jpg')).toEqual({});
  });
});
