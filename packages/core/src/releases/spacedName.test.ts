import { describe, expect, it } from 'vitest';
import { spacedName } from './spacedName';

describe('spacedName', () => {
  it('spaces the words dots and underscores join', () => {
    expect(spacedName('The.Matrix_1999..1080p  BluRay ')).toBe('The Matrix 1999 1080p BluRay');
  });

  it('pulls a source apart from the resolution it is written against', () => {
    expect(spacedName('Haruhi Dual Audio 10bit BD1080p HEVC')).toBe(
      'Haruhi Dual Audio 10bit BD 1080p HEVC',
    );
    expect(spacedName('Show WEB720p')).toBe('Show WEB 720p');
  });
});
