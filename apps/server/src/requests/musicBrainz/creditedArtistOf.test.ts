import { describe, expect, it } from 'vitest';
import { creditedArtistOf } from './creditedArtistOf';

describe('creditedArtistOf', () => {
  it('joins each artist credited with the words between them', () => {
    expect(
      creditedArtistOf({
        'artist-credit': [
          { name: 'Simon', joinphrase: ' & ' },
          { name: 'Garfunkel', joinphrase: '' },
        ],
      }),
    ).toBe('Simon & Garfunkel');
    expect(creditedArtistOf({ 'artist-credit': [] })).toBeNull();
  });
});
