import { describe, expect, it } from 'vitest';
import { inOriginalTitle } from './inOriginalTitle';

describe('inOriginalTitle', () => {
  it('names a film by its original title', () => {
    expect(
      inOriginalTitle({ title: 'Translated', year: 2001, originalTitle: 'Original' }),
    ).toMatchObject({ title: 'Original' });
  });

  it('names an episode’s programme by its original title, keeping the episode’s own', () => {
    expect(
      inOriginalTitle({
        title: 'Episode',
        seriesTitle: 'Show',
        year: 2001,
        originalTitle: 'Original',
      }),
    ).toMatchObject({ title: 'Episode', seriesTitle: 'Original' });
  });

  it('leaves a title with no original, and nothing, as they are', () => {
    const plain = { title: 'Plain', year: null };

    expect(inOriginalTitle(plain)).toBe(plain);
    expect(inOriginalTitle(null)).toBeNull();
  });
});
