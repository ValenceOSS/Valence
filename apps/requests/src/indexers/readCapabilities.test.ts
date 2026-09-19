import { describe, expect, it } from 'vitest';
import { readIndexerXml } from './readIndexerXml';
import { readCapabilities } from './readCapabilities';

const JACKETT = `<?xml version="1.0" encoding="UTF-8"?>
<caps>
  <server title="Jackett" />
  <limits default="100" max="100" />
  <searching>
    <search available="yes" supportedParams="q" />
    <tv-search available="yes" supportedParams="q,season,ep,imdbid,tvdbid" />
    <movie-search available="yes" supportedParams="q,imdbid,tmdbid" />
    <music-search available="no" supportedParams="q" />
    <audio-search available="yes" supportedParams="q,artist,album" />
    <book-search available="no" supportedParams="q" />
  </searching>
  <categories>
    <category id="2000" name="Movies">
      <subcat id="2040" name="Movies/HD" />
      <subcat id="2045" name="Movies/UHD" />
    </category>
    <category id="5000" name="TV" />
    <category id="nonsense" name="Broken" />
  </categories>
</caps>`;

describe('readCapabilities', () => {
  it('reads which searches an indexer takes, and with what', () => {
    const caps = readCapabilities(readIndexerXml(JACKETT));

    expect(caps.modes).toEqual([
      { mode: 'search', parameters: ['q'] },
      { mode: 'tv', parameters: ['q', 'season', 'ep', 'imdbid', 'tvdbid'] },
      { mode: 'movie', parameters: ['q', 'imdbid', 'tmdbid'] },
      { mode: 'music', parameters: ['q', 'artist', 'album'] },
    ]);
  });

  it('reads its categories, leaving out any without a number', () => {
    expect(readCapabilities(readIndexerXml(JACKETT)).categories).toEqual([
      {
        id: 2000,
        name: 'Movies',
        subcategories: [
          { id: 2040, name: 'Movies/HD' },
          { id: 2045, name: 'Movies/UHD' },
        ],
      },
      { id: 5000, name: 'TV', subcategories: [] },
    ]);
  });

  it('reads how many results it returns at once', () => {
    expect(readCapabilities(readIndexerXml(JACKETT)).limit).toBe(100);
  });

  it('reads an indexer that says almost nothing', () => {
    expect(
      readCapabilities(readIndexerXml('<caps><searching/><categories/><limits/></caps>')),
    ).toEqual({
      categories: [],
      modes: [],
      limit: null,
    });
  });

  it('reads a search mode given with no attributes as unavailable', () => {
    expect(
      readCapabilities(readIndexerXml('<caps><searching><search/></searching></caps>')).modes,
    ).toEqual([]);
  });

  it('refuses a document that is not capabilities at all', () => {
    expect(() => readCapabilities(readIndexerXml('<rss><channel/></rss>'))).toThrow(
      'The indexer did not say what it can search',
    );
  });
});
