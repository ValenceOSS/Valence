import { describe, expect, it } from 'vitest';
import { drawnAvatarUrl } from './drawnAvatarUrl';

describe('drawnAvatarUrl', () => {
  it('names the style and the seed, and the colour behind the face where there is one', () => {
    expect(drawnAvatarUrl('thumbs', 'dan')).toBe('/api/profiles/avatars/thumbs?seed=dan');
    expect(drawnAvatarUrl('thumbs', 'a b', '#3a8ee8')).toBe(
      '/api/profiles/avatars/thumbs?seed=a%20b&colour=%233a8ee8',
    );
  });
});
