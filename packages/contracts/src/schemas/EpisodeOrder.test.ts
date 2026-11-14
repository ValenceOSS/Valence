import { describe, expect, it } from 'vitest';
import { ChooseEpisodeOrderSchema } from './EpisodeOrder';

describe('ChooseEpisodeOrderSchema', () => {
  it('takes an episode group id, or nothing to clear the choice', () => {
    expect(ChooseEpisodeOrderSchema.safeParse({ order: '5b6f1a2c3d4e5f6a7b8c9d0e' }).success).toBe(
      true,
    );
    expect(ChooseEpisodeOrderSchema.safeParse({ order: null }).success).toBe(true);
  });

  it('refuses anything that is not shaped like one, so it cannot steer the catalogue request', () => {
    for (const order of ['../../person/popular', 'x?foo=', 'dvd', '']) {
      expect(ChooseEpisodeOrderSchema.safeParse({ order }).success).toBe(false);
    }
  });
});
