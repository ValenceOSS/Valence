import { describe, expect, it } from 'vitest';
import { RequestFailed } from './RequestFailed';
import { whySearchFailed } from './whySearchFailed';

describe('whySearchFailed', () => {
  it('says what the server said', () => {
    expect(whySearchFailed(new RequestFailed('/api/x', 503, false, 'Couldn’t reach TMDB.'))).toBe(
      'Couldn’t reach TMDB.',
    );
  });

  it('says plainly that the search failed where nobody said why', () => {
    expect(whySearchFailed(new Error('offline'))).toBe('Couldn’t search. Try again.');
    expect(whySearchFailed(null)).toBe('Couldn’t search. Try again.');
  });
});
