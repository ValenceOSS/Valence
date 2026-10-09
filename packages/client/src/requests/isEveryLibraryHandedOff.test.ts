import { describe, expect, it } from 'vitest';
import { isEveryLibraryHandedOff } from './isEveryLibraryHandedOff';

const SONARR = {
  appId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  rootFolderPath: '/tv',
  qualityProfileId: 1,
  metadataProfileId: null,
  searchesOnAdd: true,
};

describe('isEveryLibraryHandedOff', () => {
  it('holds where every library of the kinds that takes requests hands off', () => {
    expect(
      isEveryLibraryHandedOff(
        [
          { kind: 'shows', takesRequests: true, fulfilment: SONARR },
          { kind: 'shows', takesRequests: false, fulfilment: null },
          { kind: 'music', takesRequests: true, fulfilment: null },
        ],
        ['movies', 'shows'],
      ),
    ).toBe(true);
  });

  it('fails where one is fetched by Valence, or none takes requests', () => {
    expect(
      isEveryLibraryHandedOff(
        [
          { kind: 'shows', takesRequests: true, fulfilment: SONARR },
          { kind: 'movies', takesRequests: true, fulfilment: null },
        ],
        ['movies', 'shows'],
      ),
    ).toBe(false);
    expect(isEveryLibraryHandedOff([], ['movies'])).toBe(false);
  });
});
