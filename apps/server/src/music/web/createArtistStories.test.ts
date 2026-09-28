import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestCatalogueSchema } from '@ValenceContracts/schemas/MediaRequest';
import { describeArtistForRequest } from '@ValenceServer/requests/musicBrainz/describeArtistForRequest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';
import { createArtistStories } from './createArtistStories';
import { findArtistBio } from './findArtistBio';
import { findArtistOnMusicBrainz } from './findArtistOnMusicBrainz';

vi.mock('./findArtistOnMusicBrainz', () => ({ findArtistOnMusicBrainz: vi.fn() }));
vi.mock('./findArtistBio', () => ({ findArtistBio: vi.fn() }));
vi.mock('@ValenceServer/requests/musicBrainz/describeArtistForRequest', () => ({
  describeArtistForRequest: vi.fn(),
}));

const ALBUM_ONE = '00000000-0000-4000-8000-000000000001';

const ALBUM_TWO = '00000000-0000-4000-8000-000000000002';

const SINGLE = '00000000-0000-4000-8000-000000000003';

const EP = '00000000-0000-4000-8000-000000000004';

const DESCRIBED = RequestCatalogueSchema.parse({
  title: 'Bloc Party',
  year: null,
  albums: [
    { id: ALBUM_ONE, title: 'Silent Alarm', type: 'album', firstReleased: '2005-02-14' },
    { id: ALBUM_TWO, title: 'Intimacy', type: 'album', firstReleased: '2008-08-21' },
    { id: SINGLE, title: 'Helicopter', type: 'single', firstReleased: '2004-11-01' },
    { id: EP, title: 'The Nextwave Sessions', type: 'ep', firstReleased: null },
  ],
});

beforeEach(() => {
  vi.mocked(findArtistOnMusicBrainz).mockReset().mockResolvedValue('mb-bloc-party');
  vi.mocked(describeArtistForRequest).mockReset().mockResolvedValue(DESCRIBED);
  vi.mocked(findArtistBio)
    .mockReset()
    .mockResolvedValue({ bio: 'An English rock band.', sourceUrl: 'https://en.wikipedia.org/x' });
});

describe('createArtistStories', () => {
  it('tells about an artist and lists the albums and EPs the library does not have, newest first', async () => {
    const stories = createArtistStories(aWebThatAnswers({}));

    expect(await stories.about({ name: 'Bloc Party' }, ['Silent Alarm (Deluxe)'])).toEqual({
      bio: 'An English rock band.',
      sourceUrl: 'https://en.wikipedia.org/x',
      missing: [
        {
          releaseGroupId: ALBUM_TWO,
          title: 'Intimacy',
          type: 'album',
          year: 2008,
          coverUrl: `/api/music/catalogue/covers/${ALBUM_TWO}?title=Intimacy&artist=Bloc+Party`,
        },
        {
          releaseGroupId: EP,
          title: 'The Nextwave Sessions',
          type: 'ep',
          year: null,
          coverUrl: `/api/music/catalogue/covers/${EP}?title=The+Nextwave+Sessions&artist=Bloc+Party`,
        },
      ],
    });
  });

  it('says nothing where the artist is not found on MusicBrainz', async () => {
    vi.mocked(findArtistOnMusicBrainz).mockResolvedValue(null);

    expect(await createArtistStories(aWebThatAnswers({})).about({ name: 'Nobody' }, [])).toEqual({
      bio: null,
      sourceUrl: null,
      missing: [],
    });
    expect(describeArtistForRequest).not.toHaveBeenCalled();
  });

  it('asks about the same artist only once while what it found is fresh', async () => {
    const stories = createArtistStories(aWebThatAnswers({}));

    await Promise.all([
      stories.about({ name: 'Bloc Party' }, []),
      stories.about({ name: 'bloc party' }, []),
    ]);
    await stories.about({ name: 'Bloc Party' }, ['Intimacy']);

    expect(findArtistOnMusicBrainz).toHaveBeenCalledTimes(1);
  });

  it('asks again after a question that failed', async () => {
    vi.mocked(findArtistOnMusicBrainz).mockRejectedValueOnce(new Error('offline'));
    const stories = createArtistStories(aWebThatAnswers({}));

    await expect(stories.about({ name: 'Bloc Party' }, [])).rejects.toThrow('offline');
    await stories.about({ name: 'Bloc Party' }, []);

    expect(findArtistOnMusicBrainz).toHaveBeenCalledTimes(2);
  });
});
