import { describe, expect, it } from 'vitest';
import { readIndexerXml } from './readIndexerXml';
import { readReleases } from './readReleases';

const JACKETT = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Jackett',
  kind: 'torznab' as const,
};

const NZBGEEK = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  name: 'NZBgeek',
  kind: 'newznab' as const,
};

const TORZNAB = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:torznab="http://torznab.com/schemas/2015/feed">
  <channel>
    <item>
      <title>Inception.2010.1080p.BluRay.x264</title>
      <guid isPermaLink="true">https://tracker.example/details/1</guid>
      <link>http://jackett:9117/dl/tracker/?file=Inception</link>
      <comments>https://tracker.example/details/1</comments>
      <pubDate>Mon, 01 Sep 2026 12:00:00 +0000</pubDate>
      <size>8000000000</size>
      <category>2000</category>
      <enclosure url="http://jackett:9117/dl/tracker/?file=Inception" length="8000000000" type="application/x-bittorrent" />
      <torznab:attr name="category" value="2040" />
      <torznab:attr name="seeders" value="40" />
      <torznab:attr name="peers" value="43" />
      <torznab:attr name="grabs" value="1200" />
      <torznab:attr name="magneturl" value="magnet:?xt=urn:btih:abc" />
      <torznab:attr name="infohash" value="abc" />
    </item>
    <item>
      <title>Inception.2010.720p</title>
      <link>magnet:?xt=urn:btih:def</link>
      <pubDate>not a date</pubDate>
    </item>
    <item>
      <title>   </title>
    </item>
    <item>just words</item>
  </channel>
</rss>`;

const NEWZNAB = `<rss xmlns:newznab="http://www.newznab.com/DTD/2010/feeds/attributes/">
  <channel>
    <item>
      <title>Dune.Part.Two.2024.2160p.WEB-DL</title>
      <guid isPermaLink="false">a1b2</guid>
      <link>https://api.nzbgeek.info/api?t=get&amp;id=a1b2</link>
      <enclosure url="https://api.nzbgeek.info/api?t=get&amp;id=a1b2" length="0" type="application/x-nzb" />
      <newznab:attr name="size" value="21000000000" />
      <newznab:attr name="category" value="2000" />
      <newznab:attr name="category" value="2045" />
      <newznab:attr name="grabs" value="88" />
    </item>
  </channel>
</rss>`;

describe('readReleases', () => {
  it('reads a torrent with everything the feed said about it', () => {
    const [first] = readReleases(readIndexerXml(TORZNAB), JACKETT);
    const { id, ...rest } = first ?? { id: '' };

    expect(id).toMatch(/^[0-9a-f]{40}$/);
    expect(rest).toEqual({
      title: 'Inception.2010.1080p.BluRay.x264',
      indexerId: JACKETT.id,
      indexerName: 'Jackett',
      protocol: 'torrent',
      sizeBytes: 8_000_000_000,
      seeders: 40,
      leechers: 3,
      grabs: 1200,
      publishedAt: '2026-09-01T12:00:00.000Z',
      categories: [2040, 2000],
      downloadUrl: 'http://jackett:9117/dl/tracker/?file=Inception',
      magnetUrl: 'magnet:?xt=urn:btih:abc',
      infoUrl: 'https://tracker.example/details/1',
      infoHash: 'abc',
    });
  });

  it('takes a magnet link given as the link, and leaves out what the feed did not say', () => {
    const [, second] = readReleases(readIndexerXml(TORZNAB), JACKETT);

    expect(second).toMatchObject({
      title: 'Inception.2010.720p',
      magnetUrl: 'magnet:?xt=urn:btih:def',
      downloadUrl: null,
      sizeBytes: null,
      seeders: null,
      leechers: null,
      publishedAt: null,
    });
  });

  it('skips an item with no title, or one that is not an item at all', () => {
    expect(readReleases(readIndexerXml(TORZNAB), JACKETT)).toHaveLength(2);
  });

  it('gives the same release the same id every time, and different indexers different ones', () => {
    const once = readReleases(readIndexerXml(TORZNAB), JACKETT)[0]?.id;
    const again = readReleases(readIndexerXml(TORZNAB), JACKETT)[0]?.id;
    const elsewhere = readReleases(readIndexerXml(TORZNAB), { ...JACKETT, id: NZBGEEK.id })[0]?.id;

    expect(once).toBe(again);
    expect(once).not.toBe(elsewhere);
  });

  it('reads a usenet release, taking its size from where Newznab puts it', () => {
    expect(readReleases(readIndexerXml(NEWZNAB), NZBGEEK)).toEqual([
      expect.objectContaining({
        title: 'Dune.Part.Two.2024.2160p.WEB-DL',
        protocol: 'usenet',
        sizeBytes: 21_000_000_000,
        categories: [2000, 2045],
        grabs: 88,
        downloadUrl: 'https://api.nzbgeek.info/api?t=get&id=a1b2',
        magnetUrl: null,
        seeders: null,
      }),
    ]);
  });

  it('counts leechers where the feed names them itself', () => {
    const xml =
      '<rss><channel><item><title>A</title><torznab:attr name="seeders" value="2"/><torznab:attr name="leechers" value="9"/></item></channel></rss>';

    expect(readReleases(readIndexerXml(xml), JACKETT)[0]?.leechers).toBe(9);
  });

  it('reads a search that found nothing', () => {
    expect(readReleases(readIndexerXml('<rss><channel></channel></rss>'), JACKETT)).toEqual([]);
    expect(
      readReleases(readIndexerXml('<rss><channel><title>x</title></channel></rss>'), JACKETT),
    ).toEqual([]);
  });

  it('refuses an answer that is not a feed', () => {
    expect(() => readReleases(readIndexerXml('<caps/>'), JACKETT)).toThrow(
      'The indexer answered a search with something that was not results',
    );
  });
});
