import { describe, expect, it } from 'vitest';
import { cookieOf } from './cookieOf';

describe('cookieOf', () => {
  it('reads the cookie named, out of all the request carries', () => {
    const headers = new Headers({
      cookie: 'a=1; valence_unlocked=kids.2000.x%20films.3000.y; b=2',
    });

    expect(cookieOf(headers, 'valence_unlocked')).toBe('kids.2000.x films.3000.y');
  });

  it('reads nothing where the request carries no such cookie', () => {
    expect(cookieOf(new Headers({ cookie: 'a=1' }), 'valence_unlocked')).toBeNull();
    expect(cookieOf(new Headers(), 'valence_unlocked')).toBeNull();
  });
});
