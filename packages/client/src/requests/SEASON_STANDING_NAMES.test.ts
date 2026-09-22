import { describe, expect, it } from 'vitest';
import { SEASON_STANDING_NAMES } from './SEASON_STANDING_NAMES';

describe('SEASON_STANDING_NAMES', () => {
  it('names a season partly downloaded', () => {
    expect(SEASON_STANDING_NAMES.partly).toBe('Partly here');
  });
});
