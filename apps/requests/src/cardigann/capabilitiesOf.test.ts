import { describe, expect, it } from 'vitest';
import { capabilitiesOf } from './capabilitiesOf';
import { readDefinition } from './readDefinition';

describe('capabilitiesOf', () => {
  it('says what a definition can search, as a Torznab indexer would', () => {
    const definition = readDefinition(`id: x
name: X
links: [https://x.example/]
caps:
  categorymappings:
    - {id: 1, cat: Movies}
  modes:
    search: [q]
    movie-search: [q, imdbid]
    audio-search:
    xxx-search: [q]
search:
  rows:
    selector: tr
  fields:
    title:
      selector: a
`);

    expect(definition === null ? null : capabilitiesOf(definition)).toEqual({
      categories: [{ id: 2000, name: 'Movies', subcategories: [] }],
      modes: [
        { mode: 'search', parameters: ['q'] },
        { mode: 'movie', parameters: ['q', 'imdbid'] },
        { mode: 'music', parameters: [] },
      ],
      limit: null,
    });
  });
});
