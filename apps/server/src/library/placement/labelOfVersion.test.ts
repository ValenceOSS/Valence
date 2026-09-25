import { describe, expect, it } from 'vitest';
import { labelOfVersion } from './labelOfVersion';

describe('labelOfVersion', () => {
  it('names a version by what follows the shared name', () => {
    expect(labelOfVersion("/m/Heat (1995) - Director's Cut.mkv", 'Heat (1995)')).toBe(
      "Director's Cut",
    );
  });

  it('names it in full where it shares nothing', () => {
    expect(labelOfVersion('/m/Other.mkv', 'Heat')).toBe('Other');
  });
});
