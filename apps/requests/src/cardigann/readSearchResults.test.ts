import { describe, expect, it } from 'vitest';
import { buildSearchRequests } from './buildSearchRequests';
import { createCategoryMap } from './createCategoryMap';
import { queryVariables } from './queryVariables';
import { readDefinition } from './readDefinition';
import { readSearchResults } from './readSearchResults';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import type { ReleaseSearch } from '@ValenceContracts/schemas/Indexer';

const NOW = Date.parse('2026-09-19T12:00:00.000Z');

const INDEXER = { id: '0f8fad5b-d9cb-469f-a165-70867728950e', name: 'Example' };

/**
 * Reads a definition written for the test.
 */
const define = (yaml: string) => {
  const definition = readDefinition(`id: example
name: Example
links: [https://example.org/]
caps:
  categorymappings:
    - {id: 1, cat: Movies/HD, desc: "Films"}
    - {id: 2, cat: TV/HD, desc: "Series"}
  modes:
    search: [q]
${yaml}`);

  if (definition === null) {
    throw new Error('The test definition does not read.');
  }

  return definition;
};

/**
 * Searches the definition, and reads the body given as the site's answer.
 */
const answer = (
  definition: ReturnType<typeof define>,
  body: string,
  search: ReleaseSearch = { query: 'dune' },
) => {
  const categories = createCategoryMap(definition.caps);
  const [request] = buildSearchRequests({
    definition,
    variables: { ...queryVariables(search), '.Config.sitelink': 'https://example.org/' },
    categories,
    asked: [],
    siteLink: 'https://example.org/',
    nowMs: NOW,
  });

  if (request === undefined) {
    throw new Error('The test definition makes no request.');
  }

  return readSearchResults({ definition, request, body, categories, indexer: INDEXER, nowMs: NOW });
};

const HTML_SITE = define(`type: public
search:
  paths:
    - path: search/{{ .Keywords }}/
  rows:
    selector: table.results tr:has(a.title)
  fields:
    category:
      selector: a.cat
      attribute: href
      filters:
        - name: querystring
          args: c
    title_default:
      selector: a.title
    title:
      selector: a.title[title]
      attribute: title
      optional: true
      default: "{{ .Result.title_default }}"
    title|append:
      text: " [{{ .Result.category }}]"
    details:
      selector: a.title
      attribute: href
    download:
      selector: a.dl
      attribute: href
    infohash:
      selector: span.hash
      optional: true
    size:
      selector: td.size
    seeders:
      selector: td.se
    leechers:
      selector: td.le
    date:
      selector: td.age
      filters:
        - name: timeago
    downloadvolumefactor:
      case:
        img.free: 0
        "*": 1
    uploadvolumefactor:
      text: 1
    minimumratio:
      text: 1.0
    minimumseedtime:
      text: 86400
    poster:
      selector: img.poster
      attribute: src
`);

const HTML_ANSWER = `<table class="results">
  <tr><th>Header</th></tr>
  <tr>
    <td><a class="cat" href="browse.php?c=1">Films</a></td>
    <td><a class="title" href="/torrent/7/" title="Dune.2021.1080p">Dune 2021</a><img class="free"></td>
    <td><a class="dl" href="/dl/7.torrent">get</a><span class="hash">ABC</span></td>
    <td class="size">8.5 GB</td><td class="se">1,204</td><td class="le">33</td><td class="age">2 hours ago</td>
  </tr>
  <tr>
    <td><a class="cat" href="browse.php?c=2">Series</a></td>
    <td><a class="title" href="/torrent/8/">Dune Prophecy S01</a></td>
    <td></td>
    <td class="size">2 GB</td><td class="se">5</td><td class="le">1</td><td class="age">1 day ago</td>
  </tr>
</table>`;

describe('readSearchResults', () => {
  describe('an HTML answer', () => {
    it('reads each row into a release, resolving its links against the page', () => {
      const [first] = answer(HTML_SITE, HTML_ANSWER);
      const { id, magnetUrl, ...rest } = first ?? { id: '', magnetUrl: null };

      expect(id).toMatch(/^[0-9a-f]{40}$/);
      expect(magnetUrl).toContain('magnet:?xt=urn:btih:ABC&dn=Dune.2021.1080p');
      expect(rest).toEqual({
        title: 'Dune.2021.1080p [2040,100001]',
        indexerId: INDEXER.id,
        indexerName: 'Example',
        protocol: 'torrent',
        sizeBytes: Math.round(8.5 * 1024 ** 3),
        seeders: 1204,
        leechers: 33,
        grabs: null,
        publishedAt: '2026-09-19T10:00:00.000Z',
        categories: [2040],
        downloadUrl: 'https://example.org/dl/7.torrent',
        infoUrl: 'https://example.org/torrent/7/',
        infoHash: 'ABC',
        downloadFactor: 0,
        uploadFactor: 1,
        minimumRatio: 1,
        minimumSeedSeconds: 86_400,
      });
    });

    it('writes a title on one line, however the page broke it', () => {
      const broken = define(
        `search:\n  paths:\n    - path: s\n  rows:\n    selector: tr\n  fields:\n    title:\n      selector: a\n    download:\n      selector: a\n      attribute: href\n`,
      );

      expect(
        answer(
          broken,
          '<table><tr><td><a href="1">CLANNAD\n      HD   Edition\n</a></td></tr></table>',
        )[0]?.title,
      ).toBe('CLANNAD HD Edition');
    });

    it('falls back to a default for an optional field the row lacks', () => {
      expect(answer(HTML_SITE, HTML_ANSWER)[0]?.title.startsWith('Dune.2021.1080p')).toBe(true);
    });

    it('drops a row missing a required field, and one with nowhere to fetch it from', () => {
      expect(answer(HTML_SITE, HTML_ANSWER)).toHaveLength(1);
    });

    it('builds no magnet link for a private site', () => {
      const privateSite = define(
        `type: private\nsearch:\n  paths:\n    - path: s\n  rows:\n    selector: tr:has(a.dl)\n  fields:\n    title:\n      selector: a.title\n    download:\n      selector: a.dl\n      attribute: href\n    infohash:\n      selector: span.hash\n`,
      );

      expect(answer(privateSite, HTML_ANSWER)[0]).toMatchObject({
        magnetUrl: null,
        infoHash: 'ABC',
      });
    });

    it('reads nothing from an answer with no rows, or a selector that cannot run', () => {
      expect(answer(HTML_SITE, '<p>No results</p>')).toEqual([]);
      expect(
        answer(
          define(
            `search:\n  paths:\n    - path: s\n  rows:\n    selector: "tr:bogus("\n  fields:\n    title:\n      selector: a\n`,
          ),
          HTML_ANSWER,
        ),
      ).toEqual([]);
    });

    it('merges rows a site spreads across several', () => {
      const split = define(`search:
  paths:
    - path: s
  rows:
    selector: tbody > tr
    after: 1
  fields:
    title:
      selector: a.t
    download:
      selector: a.d
      attribute: href
    size:
      selector: td.s
`);

      expect(
        answer(
          split,
          '<table><tbody><tr><td><a class="t">One</a></td></tr><tr><td><a class="d" href="1.torrent">d</a></td><td class="s">1 GB</td></tr><tr><td><a class="t">Two</a></td></tr><tr><td><a class="d" href="2.torrent">d</a></td><td class="s">2 GB</td></tr></tbody></table>',
        ).map((release) => [release.title, release.downloadUrl, release.sizeBytes]),
      ).toEqual([
        ['One', 'https://example.org/1.torrent', 1024 ** 3],
        ['Two', 'https://example.org/2.torrent', 2 * 1024 ** 3],
      ]);
    });

    it('finds the date in a header row above where the rows carry none', () => {
      const dated = define(`search:
  paths:
    - path: s
  rows:
    selector: tr.t
    dateheaders:
      selector: td.day
      filters:
        - name: dateparse
          args: "yyyy-MM-dd"
  fields:
    title:
      selector: a
    download:
      selector: a
      attribute: href
`);

      expect(
        answer(
          dated,
          '<table><tr><td class="day">2026-09-01</td></tr><tr class="t"><td><a href="1.torrent">One</a></td></tr><tr class="t"><td><a href="2.torrent">Two</a></td></tr></table>',
        ).map((release) => release.publishedAt),
      ).toEqual(['2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z']);
    });

    it('keeps only rows mentioning every word, where the definition asks', () => {
      const loose = define(`search:
  paths:
    - path: s
  rows:
    selector: tr
    filters:
      - name: andmatch
  fields:
    title:
      selector: a
    download:
      selector: a
      attribute: href
    description:
      selector: span
`);
      const body =
        '<table><tr><td><a href="1">Dune Part Two</a></td></tr><tr><td><a href="2">Dune</a><span>part two</span></td></tr><tr><td><a href="3">Dune Messiah</a></td></tr></table>';

      expect(
        answer(loose, body, { query: 'the dune part two' }).map((release) => release.title),
      ).toEqual(['Dune Part Two', 'Dune']);
      expect(
        answer(loose, body, { mode: 'movie', query: 'dune part two', imdbId: 'tt1' }),
      ).toHaveLength(3);
      expect(answer(loose, body, { query: '' })).toHaveLength(3);
    });
  });

  describe('an XML answer', () => {
    it('reads it as XML', () => {
      const xml = define(`search:
  paths:
    - path: rss
      response:
        type: xml
  rows:
    selector: item
  fields:
    title:
      selector: title
    download:
      selector: enclosure
      attribute: url
    date:
      selector: pubDate
`);

      expect(
        answer(
          xml,
          '<rss><channel><item><title>Dune</title><enclosure url="https://example.org/1.torrent"/><pubDate>Mon, 01 Sep 2026 12:00:00 +0000</pubDate></item></channel></rss>',
        )[0],
      ).toMatchObject({
        title: 'Dune',
        downloadUrl: 'https://example.org/1.torrent',
        publishedAt: '2026-09-01T12:00:00.000Z',
      });
    });
  });

  describe('a JSON answer', () => {
    const JSON_SITE = define(`search:
  paths:
    - path: api
      response:
        type: json
        noResultsMessage: "No movies found"
  rows:
    selector: data.movies:has(torrents)
    attribute: torrents
    multiple: true
    count:
      selector: data.movie_count
  fields:
    title:
      selector: ..title
      filters:
        - name: append
          args: ".{{ .Result.quality }}"
    quality:
      selector: quality
    download:
      selector: url
    size:
      selector: size_bytes
    seeders:
      selector: seeds
    leechers:
      selector: peers
    date:
      selector: ..date_uploaded_unix
    category:
      text: 1
`);

    const BODY = JSON.stringify({
      data: {
        movie_count: 2,
        movies: [
          {
            title: 'Dune',
            date_uploaded_unix: 1_756_728_000,
            torrents: [
              {
                quality: '1080p',
                url: 'https://example.org/1.torrent',
                size_bytes: 2000,
                seeds: 10,
                peers: 2,
              },
              {
                quality: '2160p',
                url: 'https://example.org/2.torrent',
                size_bytes: 8000,
                seeds: 4,
                peers: 1,
              },
            ],
          },
          { title: 'Nothing to fetch' },
        ],
      },
    });

    it('reads several releases from each row, reading the row itself with ..', () => {
      expect(
        answer(JSON_SITE, BODY).map((release) => [
          release.title,
          release.sizeBytes,
          release.publishedAt,
        ]),
      ).toEqual([
        ['Dune.', 2000, '2025-09-01T12:00:00.000Z'],
        ['Dune.', 8000, '2025-09-01T12:00:00.000Z'],
      ]);
    });

    it('says there is nothing where the site says so, or counts none', () => {
      expect(answer(JSON_SITE, '{"status":"No movies found"}')).toEqual([]);
      expect(answer(JSON_SITE, JSON.stringify({ data: { movie_count: 0, movies: [] } }))).toEqual(
        [],
      );
    });

    it('fails on an answer that is not JSON, or has no rows where it must', () => {
      expect(() => answer(JSON_SITE, '<html>')).toThrow(IndexerFailure);
      expect(() => answer(JSON_SITE, JSON.stringify({ data: { movie_count: 1 } }))).toThrow(
        'The site answered a search without the rows its definition expects',
      );
    });

    it('reads a missing list as no results where the definition allows it', () => {
      const lenient = define(`search:
  paths:
    - path: api
      response:
        type: json
        noResultsMessage: ""
  rows:
    selector: results
    missingAttributeEqualsNoResults: true
  fields:
    title:
      selector: name
    download:
      selector: link
`);

      expect(answer(lenient, '{}')).toEqual([]);
      expect(answer(lenient, '')).toEqual([]);
      expect(
        answer(
          lenient,
          JSON.stringify({
            results: [{ name: 'A', link: 'https://example.org/a' }, { link: 'x' }],
          }),
        ),
      ).toHaveLength(1);
    });
  });
});
