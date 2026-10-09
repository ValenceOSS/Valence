import { describe, expect, it } from 'vitest';
import { isSeasonHeld } from './isSeasonHeld';

describe('isSeasonHeld', () => {
  it('holds a season the library has every episode of', () => {
    expect(isSeasonHeld({ standing: 'library' })).toBe(true);
  });

  it('leaves a season partly held, asked for or not yet here open to asking', () => {
    expect(isSeasonHeld({ standing: 'partly' })).toBe(false);
    expect(isSeasonHeld({ standing: 'requested' })).toBe(false);
    expect(isSeasonHeld({ standing: 'askable' })).toBe(false);
  });
});
