import { describe, expect, it } from 'vitest';
import { spacedName } from './spacedName';

describe('spacedName', () => {
  it('spaces the words dots and underscores join', () => {
    expect(spacedName('The.Matrix_1999..1080p  BluRay ')).toBe('The Matrix 1999 1080p BluRay');
  });
});
