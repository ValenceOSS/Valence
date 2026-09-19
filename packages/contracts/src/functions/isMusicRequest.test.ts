import { describe, expect, it } from 'vitest';
import { isMusicRequest } from './isMusicRequest';

describe('isMusicRequest', () => {
  it('tells music from films and series', () => {
    expect(isMusicRequest('artist')).toBe(true);
    expect(isMusicRequest('album')).toBe(true);
    expect(isMusicRequest('film')).toBe(false);
    expect(isMusicRequest('series')).toBe(false);
  });
});
