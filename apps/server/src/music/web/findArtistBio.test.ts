import { describe, expect, it } from 'vitest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';
import { findArtistBio } from './findArtistBio';

const LINKED = {
  'musicbrainz.org/ws/2/artist/mb-1': {
    relations: [
      { type: 'official homepage', url: { resource: 'https://pinkfloyd.com' } },
      { type: 'wikidata', url: { resource: 'https://www.wikidata.org/wiki/Q2306' } },
    ],
  },
  'wikidata.org/wiki/Special:EntityData/Q2306.json': {
    entities: { Q2306: { sitelinks: { enwiki: { title: 'Pink Floyd' } } } },
  },
};

describe('findArtistBio', () => {
  it('reads the summary of the Wikipedia article the artist is linked to', async () => {
    const web = aWebThatAnswers({
      ...LINKED,
      'en.wikipedia.org/api/rest_v1/page/summary/Pink_Floyd': {
        extract: ' Pink Floyd were an English rock band. ',
        content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Pink_Floyd' } },
      },
    });

    expect(await findArtistBio(web, 'mb-1')).toEqual({
      bio: 'Pink Floyd were an English rock band.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Pink_Floyd',
    });
  });

  it('keeps the sentences where the article gives no address of its own', async () => {
    const web = aWebThatAnswers({
      ...LINKED,
      'en.wikipedia.org/api/rest_v1/page/summary/Pink_Floyd': { extract: 'A band.' },
    });

    expect(await findArtistBio(web, 'mb-1')).toEqual({ bio: 'A band.', sourceUrl: null });
  });

  it('finds nothing where the artist is not linked to Wikidata', async () => {
    const web = aWebThatAnswers({ 'musicbrainz.org/ws/2/artist/mb-1': { relations: [] } });

    expect(await findArtistBio(web, 'mb-1')).toBeNull();
    expect(web.json).toHaveBeenCalledTimes(1);
  });

  it('finds nothing where Wikidata has no English article', async () => {
    const web = aWebThatAnswers({
      'musicbrainz.org/ws/2/artist/mb-1': LINKED['musicbrainz.org/ws/2/artist/mb-1'],
      'wikidata.org/wiki/Special:EntityData/Q2306.json': {
        entities: { Q2306: { sitelinks: {} } },
      },
    });

    expect(await findArtistBio(web, 'mb-1')).toBeNull();
  });

  it('finds nothing where the article says nothing', async () => {
    const web = aWebThatAnswers({
      ...LINKED,
      'en.wikipedia.org/api/rest_v1/page/summary/Pink_Floyd': { extract: '   ' },
    });

    expect(await findArtistBio(web, 'mb-1')).toBeNull();
  });
});
