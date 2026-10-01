import { describe, expect, it } from 'vitest';
import { arrKindOf } from './arrKindOf';

describe('arrKindOf', () => {
  it('hands films to Radarr, series to Sonarr and music to Lidarr', () => {
    expect(arrKindOf('movies')).toBe('radarr');
    expect(arrKindOf('shows')).toBe('sonarr');
    expect(arrKindOf('music')).toBe('lidarr');
  });

  it('keeps books for Valence', () => {
    expect(arrKindOf('books')).toBeNull();
  });
});
