import { describe, expect, it } from 'vitest';
import { MusicBrainzReleaseGroupSchema } from './MusicBrainzReleaseGroupSchema';
import { catalogueAlbumOf } from './catalogueAlbumOf';

describe('catalogueAlbumOf', () => {
  it('reads a release group as an album, its kind and when it came out', () => {
    expect(
      catalogueAlbumOf(
        MusicBrainzReleaseGroupSchema.parse({
          id: '0f8fad5b-d9cb-469f-a165-70867728950e',
          title: 'Pulse',
          'primary-type': 'Album',
          'secondary-types': ['Live'],
          'first-release-date': '1995-05-29',
        }),
      ),
    ).toEqual({
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      title: 'Pulse',
      type: 'live',
      firstReleased: '1995-05-29',
    });
  });
});
