import { describe, expect, it } from 'vitest';
import { buildSearchRequests } from './buildSearchRequests';
import { createCategoryMap } from './createCategoryMap';
import { createThreadedSearchReader } from './createThreadedSearchReader';
import { queryVariables } from './queryVariables';
import { readDefinition } from './readDefinition';
import { readSearchResults } from './readSearchResults';

const NOW = Date.parse('2026-09-19T12:00:00.000Z');

const INDEXER = { id: '0f8fad5b-d9cb-469f-a165-70867728950e', name: 'Example' };

const DEFINITION = readDefinition(`id: example
name: Example
links: [https://example.org/]
caps:
  categorymappings:
    - {id: 1, cat: Movies/HD, desc: "Films"}
  modes:
    search: [q]
type: public
search:
  paths:
    - path: search/{{ .Keywords }}/
  rows:
    selector: table.results tr:has(a.title)
  fields:
    category:
      text: 1
    title:
      selector: a.title
    details:
      selector: a.title
      attribute: href
    download:
      selector: a.dl
      attribute: href
    size:
      selector: td.size
    seeders:
      selector: td.se
    leechers:
      selector: td.le
    date:
      text: now
`);

const BODY = `<table class="results">
  <tr>
    <td><a class="title" href="/torrent/7/">Dune.2021.1080p</a></td>
    <td><a class="dl" href="/dl/7.torrent">get</a></td>
    <td class="size">8.5 GB</td><td class="se">12</td><td class="le">3</td>
  </tr>
</table>`;

const HANGING = readDefinition(`id: example
name: Example
links: [https://example.org/]
caps:
  categorymappings:
    - {id: 1, cat: Movies/HD, desc: "Films"}
  modes:
    search: [q]
type: public
search:
  paths:
    - path: search/{{ .Keywords }}/
  rows:
    selector: table.results tr:has(a.title)
  fields:
    category:
      text: 1
    title:
      selector: a.title
      filters:
        - name: re_replace
          args: ["(a+)+$", "x"]
    details:
      selector: a.title
      attribute: href
    download:
      selector: a.dl
      attribute: href
    size:
      selector: td.size
    seeders:
      selector: td.se
    leechers:
      selector: td.le
    date:
      text: now
`);

/**
 * The page the test definition asks for, as the site answered it.
 */
const page = (definition = DEFINITION, body = BODY) => {
  if (definition === null) {
    throw new Error('The test definition does not read.');
  }

  const [request] = buildSearchRequests({
    definition,
    variables: { ...queryVariables({ query: 'dune' }), '.Config.sitelink': 'https://example.org/' },
    categories: createCategoryMap(definition.caps),
    asked: [],
    siteLink: 'https://example.org/',
    nowMs: NOW,
  });

  if (request === undefined) {
    throw new Error('The test definition makes no request.');
  }

  return { definition, request, body, indexer: INDEXER, nowMs: NOW };
};

describe('createThreadedSearchReader', () => {
  it('reads a page on a thread into the same releases as reading it here', async () => {
    const asked = page();
    const read = createThreadedSearchReader(1);

    expect(await read(asked)).toEqual(
      readSearchResults({ ...asked, categories: createCategoryMap(asked.definition.caps) }),
    );
  });

  it('answers nothing for a page the thread cannot read, so it is read here instead', async () => {
    const asked = page();
    const read = createThreadedSearchReader(1);

    expect(
      await read({
        ...asked,
        request: { ...asked.request, path: { ...asked.request.path, response: { type: 'json' } } },
      }),
    ).toBeNull();
  });

  it('stops a thread stuck on a page and answers that page with no results', async () => {
    const asked = page(HANGING, BODY.replace('Dune.2021.1080p', `${'a'.repeat(60)}b`));
    const read = createThreadedSearchReader(1, 1_000);
    const started = Date.now();

    expect(await read(asked)).toEqual([]);
    expect(Date.now() - started).toBeLessThan(10_000);
    expect(await read(page())).not.toBeNull();
  }, 30_000);
});
