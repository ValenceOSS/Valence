import { describe, expect, it } from 'vitest';
import { saidWhenWithdrawn } from './saidWhenWithdrawn';

describe('saidWhenWithdrawn', () => {
  it('says whether the plugin was turned off or removed', () => {
    expect(saidWhenWithdrawn('AniList', 'disabled')).toBe(
      'AniList was turned off by an administrator.',
    );
    expect(saidWhenWithdrawn('AniList', 'removed')).toBe(
      'AniList was removed by an administrator.',
    );
  });
});
