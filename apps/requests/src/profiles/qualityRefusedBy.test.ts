import { describe, expect, it } from 'vitest';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { qualityRefusedBy } from './qualityRefusedBy';

const FOUR_K = aProfile({ qualities: ['webdl-2160p', 'bluray-2160p'] });

describe('qualityRefusedBy', () => {
  it('refuses a resolution off the profile’s list', () => {
    expect(qualityRefusedBy({ resolution: '1080p', source: 'webdl' }, FOUR_K)).toBe('1080p');
  });

  it('refuses a cinema recording the profile does not ask for', () => {
    expect(qualityRefusedBy({ resolution: '2160p', source: 'telesync' }, FOUR_K)).toBe('telesync');
    expect(qualityRefusedBy({ source: 'cam' }, FOUR_K)).toBe('cam');
  });

  it('lets labelling differ, where the source is a fair copy of the film', () => {
    expect(qualityRefusedBy({ resolution: '2160p', source: 'webrip' }, FOUR_K)).toBeNull();
  });

  it('holds nothing unknown against it', () => {
    expect(qualityRefusedBy({}, FOUR_K)).toBeNull();
  });

  it('leaves music alone', () => {
    expect(qualityRefusedBy({ resolution: '480p' }, aProfile({ kind: 'music' }))).toBeNull();
  });
});
