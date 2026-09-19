import { describe, expect, it } from 'vitest';
import { buildSearchRequests } from './buildSearchRequests';
import { createCategoryMap } from './createCategoryMap';
import { queryVariables } from './queryVariables';
import { readDefinition } from './readDefinition';
import type { ReleaseSearch } from '@ValenceContracts/schemas/Indexer';

const NOW = Date.parse('2026-09-19T12:00:00.000Z');

/**
 * A definition with the search block given.
 */
const aDefinition = (search: string, encoding = 'UTF-8') => {
  const definition = readDefinition(`id: x
name: X
links: [https://x.example/]
encoding: ${encoding}
caps:
  categorymappings:
    - {id: 1, cat: Movies/HD, desc: "Films", default: true}
    - {id: 2, cat: TV/HD, desc: "Series"}
    - {id: 9, cat: XXX, desc: "Adult"}
  modes:
    search: [q]
search:
${search}
  rows:
    selector: tr
  fields:
    title:
      selector: a
`);

  if (definition === null) {
    throw new Error('The test definition does not read.');
  }

  return definition;
};

/**
 * The requests a search makes of the definition.
 */
const build = (
  definition: ReturnType<typeof aDefinition>,
  search: ReleaseSearch,
  asked: number[] = [],
) =>
  buildSearchRequests({
    definition,
    variables: { ...queryVariables(search), '.Config.sitelink': 'https://x.example/' },
    categories: createCategoryMap(definition.caps),
    asked,
    siteLink: 'https://x.example/',
    nowMs: NOW,
  });

describe('buildSearchRequests', () => {
  it('builds a request with the inputs as a query string', () => {
    const [request] = build(
      aDefinition(`  paths:
    - path: browse.php
  inputs:
    search: "{{ .Keywords }}"
    incldead: 1
    empty: "{{ .Query.Album }}"`),
      { query: 'dune part two' },
    );

    expect(request).toMatchObject({
      url: 'https://x.example/browse.php?search=dune+part+two&incldead=1',
      method: 'GET',
      body: null,
    });
  });

  it('writes values into the path encoded for a path', () => {
    const [request] = build(
      aDefinition(`  paths:
    - path: "search/{{ .Keywords }}/1/"`),
      { query: 'dune & co' },
    );

    expect(request?.url).toBe('https://x.example/search/dune%20%26%20co/1/');
  });

  it('applies the keyword filters to .Keywords', () => {
    const [request] = build(
      aDefinition(`  paths:
    - path: s.php
  keywordsfilters:
    - name: re_replace
      args: ["[^a-zA-Z0-9]+", "%"]
  inputs:
    q: "{{ .Keywords }}"
    raw: "{{ .Query.Keywords }}"`),
      { query: 'dune part two' },
    );

    expect(request?.url).toBe('https://x.example/s.php?q=dune%25part%25two&raw=dune+part+two');
  });

  it('writes $raw inputs as they are, encoding only the values in them', () => {
    const [request] = build(
      aDefinition(`  paths:
    - path: b.php
  inputs:
    $raw: "{{ range .Categories }}cat[]={{.}}&{{end}}q={{ .Keywords }}"`),
      { query: 'a b' },
      [2000, 5000],
    );

    expect(request?.url).toBe('https://x.example/b.php?cat[]=1&cat[]=2&q=a+b');
  });

  it('searches the default categories where the search asks for none it has', () => {
    const [request] = build(
      aDefinition(`  paths:
    - path: b.php
  inputs:
    c: "{{ join .Categories \\",\\" }}"`),
      { query: 'x' },
      [7000],
    );

    expect(request?.url).toBe('https://x.example/b.php?c=1');
  });

  it('uses a path only for the categories it names, or all but those after !', () => {
    const definition = aDefinition(`  paths:
    - path: normal.php
      categories: ["!", 9]
    - path: adult.php
      categories: [9]
  inputs:
    c: "{{ join .Categories \\",\\" }}"`);

    expect(build(definition, { query: 'x' }, [2000, 5000]).map((request) => request.url)).toEqual([
      'https://x.example/normal.php?c=1%2C2',
    ]);
    expect(build(definition, { query: 'x' }, [6000]).map((request) => request.url)).toEqual([
      'https://x.example/adult.php?c=9',
    ]);
    expect(build(definition, { query: 'x' }, [2000, 6000]).map((request) => request.url)).toEqual([
      'https://x.example/normal.php?c=1',
      'https://x.example/adult.php?c=9',
    ]);
  });

  it('posts where the path says so, in the site’s character set, with its headers', () => {
    const [request] = build(
      aDefinition(
        `  paths:
    - path: "{{ if .Keywords }}search{{ else }}latest{{ end }}"
      method: "{{ if .Keywords }}post{{ else }}get{{ end }}"
  headers:
    x-requested-with: ["XMLHttpRequest"]
    referer: "{{ .Config.sitelink }}"
  inputs:
    q: "{{ .Keywords }}"`,
        'windows-1251',
      ),
      { query: 'Мир' },
    );

    expect(request).toMatchObject({
      url: 'https://x.example/search',
      method: 'POST',
      body: 'q=%CC%E8%F0',
      headers: { 'x-requested-with': 'XMLHttpRequest', referer: 'https://x.example/' },
    });
  });

  it('keeps empty inputs where the definition says they matter, and adds to an existing query', () => {
    const [request] = build(
      aDefinition(`  allowEmptyInputs: true
  paths:
    - path: b.php?view=list
      inheritinputs: false
      inputs:
        q: "{{ .Keywords }}"
  inputs:
    ignored: 1`),
      {},
    );

    expect(request?.url).toBe('https://x.example/b.php?view=list&q=');
  });

  it('asks the same address once', () => {
    const requests = build(
      aDefinition(`  paths:
    - path: b.php
    - path: b.php`),
      { query: 'x' },
    );

    expect(requests).toHaveLength(1);
  });

  it('falls back to the single path of an older definition', () => {
    expect(build(aDefinition(`  path: old.php`), {})[0]?.url).toBe('https://x.example/old.php');
    expect(build(aDefinition(`  inputs: {}`), {})).toEqual([]);
  });

  it('carries the variables each request is read with', () => {
    const [request] = build(
      aDefinition(`  paths:
    - path: b.php`),
      { query: 'dune' },
      [5000],
    );

    expect(request?.variables).toMatchObject({ '.Keywords': 'dune', '.Categories': ['2'] });
  });
});
