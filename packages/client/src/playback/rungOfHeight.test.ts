import { describe, expect, it } from 'vitest';
import { rungOfHeight } from './rungOfHeight';

describe('rungOfHeight', () => {
  it('names a picture by the rung of its own height', () => {
    expect(rungOfHeight(1080)).toBe('1080p');
    expect(rungOfHeight(720)).toBe('720p');
    expect(rungOfHeight(2160)).toBe('2160p');
  });

  it('names a film in scope by the smallest rung tall enough to hold it', () => {
    expect(rungOfHeight(800)).toBe('1080p');
    expect(rungOfHeight(536)).toBe('720p');
  });

  it('names anything taller than the ladder as its top', () => {
    expect(rungOfHeight(4320)).toBe('2160p');
  });
});
