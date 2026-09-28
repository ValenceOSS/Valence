import { describe, expect, it } from 'vitest';
import { ArtistStorySchema, MissingAlbumSchema } from './ArtistStory';

const missing = {
  releaseGroupId: '00000000-0000-4000-8000-00000000abcd',
  title: 'Danger Days',
  type: 'album',
  year: 2010,
  coverUrl: '/api/music/catalogue/cover/abcd',
};

describe('ArtistStorySchema', () => {
  it('reads an artist with a biography and the albums not in the library', () => {
    const story = {
      bio: 'A band from New Jersey.',
      sourceUrl: 'https://example.org',
      missing: [missing],
    };

    expect(ArtistStorySchema.parse(story)).toEqual(story);
  });

  it('reads an artist nothing is known about', () => {
    expect(ArtistStorySchema.parse({ bio: null, sourceUrl: null, missing: [] }).missing).toEqual(
      [],
    );
  });

  it('refuses a missing album whose release group is not an id', () => {
    expect(MissingAlbumSchema.safeParse({ ...missing, releaseGroupId: 'nope' }).success).toBe(
      false,
    );
  });

  it('reads a missing album of no known type or year', () => {
    expect(MissingAlbumSchema.parse({ ...missing, type: null, year: null }).type).toBeNull();
  });
});
