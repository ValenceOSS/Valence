import { describe, expect, it } from 'vitest';
import { legacyQualitiesOf } from './legacyQualitiesOf';

describe('legacyQualitiesOf', () => {
  it('ranks every source within every resolution, as the old scores did', () => {
    expect(
      legacyQualitiesOf({
        resolutions: ['1080p', '720p'],
        sources: ['bluray', 'webdl', 'remux'],
        upgradeUntilResolution: null,
        upgradeUntilSource: null,
      }),
    ).toEqual({
      qualities: ['bluray-1080p', 'webdl-1080p', 'remux-1080p', 'bluray-720p', 'webdl-720p'],
      cutoff: null,
    });
  });

  it('upgrades until the quality the resolution and source make, or the best of the resolution', () => {
    const kept = {
      resolutions: ['1080p' as const],
      sources: ['webdl' as const, 'webrip' as const],
      upgradeUntilResolution: '1080p' as const,
    };

    expect(legacyQualitiesOf({ ...kept, upgradeUntilSource: 'webrip' }).cutoff).toBe(
      'webrip-1080p',
    );
    expect(legacyQualitiesOf({ ...kept, upgradeUntilSource: null }).cutoff).toBe('webdl-1080p');
  });
});
