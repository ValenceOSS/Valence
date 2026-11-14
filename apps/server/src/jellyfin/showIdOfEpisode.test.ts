import { describe, expect, it } from 'vitest';
import { showIdOfEpisode } from './showIdOfEpisode';

describe('showIdOfEpisode', () => {
  it('uses the series where the catalogue named one', () => {
    expect(showIdOfEpisode({ seriesId: 's1', seriesTitle: 'Twin Peaks' })).toBe('s1');
  });

  it('uses a slug of the title where it did not', () => {
    expect(showIdOfEpisode({ seriesId: null, seriesTitle: 'Twin Peaks' })).toBe('twin-peaks');
  });

  it('has nothing for a film', () => {
    expect(showIdOfEpisode({ seriesId: null, seriesTitle: null })).toBeNull();
  });
});
