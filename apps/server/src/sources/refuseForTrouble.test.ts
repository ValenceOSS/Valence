import { describe, expect, it } from 'vitest';
import { refuseForTrouble } from './refuseForTrouble';

describe('refuseForTrouble', () => {
  it('says which site was rate limiting', () => {
    expect(refuseForTrouble({ source: 'TMDB', reason: 'rateLimited' })).toEqual({
      error: 'TMDB is limiting how often Valence can ask. Try again in a minute.',
      code: 'error.sources.sourceIsLimitingHowOften',
      values: { source: 'TMDB' },
    });
  });

  it.each([
    ['keyMissing', 'Valence has no key for TMDB yet. An administrator can add one in Settings.'],
    ['keyRefused', 'TMDB didn’t accept Valence’s key. An administrator can check it in Settings.'],
    ['refused', 'TMDB refused to answer Valence.'],
    ['faulty', 'TMDB is having problems right now. Try again later.'],
    ['unreachable', 'Couldn’t reach TMDB. Try again in a moment.'],
  ] as const)('says what %s means', (reason, error) => {
    expect(refuseForTrouble({ source: 'TMDB', reason }).error).toBe(error);
  });
});
