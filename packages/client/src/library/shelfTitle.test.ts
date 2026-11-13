import { describe, expect, it } from 'vitest';
import { shelfTitle } from './shelfTitle';

describe('shelfTitle', () => {
  it('names a genre by itself', () => {
    expect(shelfTitle({ genre: 'Drama', order: null, decade: null, page: 0 })).toBe('Drama');
  });

  it('names a decade the way somebody says it', () => {
    expect(shelfTitle({ genre: null, order: null, decade: 1980, page: 0 })).toContain('1980');
  });

  it('names a genre seen from another angle by that angle', () => {
    expect(shelfTitle({ genre: 'Drama', order: 'newest', decade: null, page: 0 })).toContain(
      'Drama',
    );
    expect(shelfTitle({ genre: 'Drama', order: 'title', decade: null, page: 0 })).toBe('Drama A–Z');
    expect(shelfTitle({ genre: 'Drama', order: null, decade: 1990, page: 0 })).toContain('1990');
    expect(shelfTitle({ genre: 'Drama', order: null, decade: null, page: 1 })).toContain('Drama');
  });
});
