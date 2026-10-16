import { describe, expect, it } from 'vitest';
import { isItemInScope } from './isItemInScope';

const item = { season: 1, episode: 13, cour: 2, absolute: 13 };

describe('isItemInScope', () => {
  it('takes everything where nothing is named', () => {
    expect(isItemInScope(item, null, false)).toBe(true);
  });

  it('takes a season, or one episode of it', () => {
    expect(isItemInScope(item, { season: 1, episode: null }, false)).toBe(true);
    expect(isItemInScope(item, { season: 1, episode: 13 }, false)).toBe(true);
    expect(isItemInScope(item, { season: 2, episode: null }, false)).toBe(false);
  });

  it("takes anime's cour, or one episode by its number from the first", () => {
    expect(isItemInScope(item, { season: 2, episode: null }, true)).toBe(true);
    expect(isItemInScope(item, { season: 2, episode: 13 }, true)).toBe(true);
    expect(isItemInScope(item, { season: 1, episode: null }, true)).toBe(false);
  });
});
