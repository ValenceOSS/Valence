import { describe, expect, it } from 'vitest';
import { readDefinition } from './readDefinition';

const YAML = `---
id: example
name: Example
description: "An example tracker"
language: en-US
type: public
encoding: UTF-8
links:
  - https://example.org/
caps:
  categorymappings:
    - {id: 1, cat: Movies, desc: "Movies", default: true}
  modes:
    search: [q]
    movie-search: [q, imdbid]
settings: []
search:
  paths:
    - path: search/{{ .Keywords }}/1/
      categories: ["!", 9]
  inputs:
    $raw: "{{ range .Categories }}c[]={{.}}&{{end}}"
    keep: 1
  rows:
    selector: tr
    after: 1
  fields:
    title_default:
      selector: a
    title:
      selector: a[title]
      attribute: title
      optional: true
      default: "{{ .Result.title_default }}"
    size:
      text: 1 GB
    title:
      text: " (again)"
    seeders:
      selector: td.s
      filters:
        - name: re_replace
          args: ["\\\\D", ""]
        - name: split
          args: ["/", 0]
`;

describe('readDefinition', () => {
  it('reads a definition, keeping fields in order with any name repeated', () => {
    const definition = readDefinition(YAML);

    expect(definition?.search.fields.map(([name]) => name)).toEqual([
      'title_default',
      'title',
      'size',
      'title',
      'seeders',
    ]);
  });

  it('writes scalars as text, whatever type YAML gave them', () => {
    const definition = readDefinition(YAML);

    expect(definition?.search.inputs).toEqual({
      $raw: '{{ range .Categories }}c[]={{.}}&{{end}}',
      keep: '1',
    });
    expect(definition?.search.paths?.[0]?.categories).toEqual(['!', '9']);
    expect(definition?.caps.categorymappings?.[0]?.id).toBe('1');
    expect(definition?.search.fields[4]?.[1].filters).toEqual([
      { name: 're_replace', args: ['\\D', ''] },
      { name: 'split', args: ['/', '0'] },
    ]);
  });

  it('fills in what a definition leaves out', () => {
    const definition = readDefinition(YAML);

    expect(definition?.settings).toEqual([]);
    expect(definition?.login).toBeUndefined();
    expect(definition?.search.rows.after).toBe(1);
    expect(definition?.testlinktorrent).toBe(true);
  });

  it('reads no settings as none given, which means a username and password', () => {
    expect(readDefinition(YAML.replace('settings: []\n', ''))?.settings).toBeNull();
  });

  it('refuses a definition missing what it must have', () => {
    expect(readDefinition(YAML.replace(/links:\n {2}- https:\/\/example.org\/\n/, ''))).toBeNull();
  });

  it('refuses what is not YAML at all, or not a mapping', () => {
    expect(readDefinition('id: [unclosed')).toBeNull();
    expect(readDefinition('- just\n- a list\n')).toBeNull();
  });

  it('reads a definition whose fields are not a mapping as having none', () => {
    expect(
      readDefinition(YAML.replace(/ {2}fields:[\s\S]*$/, '  fields: []\n'))?.search.fields,
    ).toEqual([]);
  });
});
