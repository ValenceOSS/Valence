import { describe, expect, it } from 'vitest';
import { showIdOf } from './showIdOf';

describe('showIdOf', () => {
  it('uses the series the scanner matched', () => {
    expect(showIdOf({ seriesId: 'series-1', seriesTitle: 'Severance' })).toBe('series-1');
  });

  it('falls back to a slug of the series title', () => {
    expect(showIdOf({ seriesId: null, seriesTitle: 'Severance' })).not.toBeNull();
  });

  it('says nothing for a film', () => {
    expect(showIdOf({ seriesId: null, seriesTitle: null })).toBeNull();
  });
});
