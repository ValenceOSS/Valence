import { describe, expect, it } from 'vitest';
import { isListenedTo } from './isListenedTo';

describe('isListenedTo', () => {
  it('listens to songs and audiobooks, and watches everything else', () => {
    expect(isListenedTo('song')).toBe(true);
    expect(isListenedTo('book')).toBe(true);
    expect(isListenedTo('movie')).toBe(false);
    expect(isListenedTo('episode')).toBe(false);
  });
});
