import { describe, expect, it } from 'vitest';
import { readDefinition } from './readDefinition';
import { siteLinkFor } from './siteLinkFor';

const DEFINITION = readDefinition(`id: x
name: X
links: [https://new.example/, https://mirror.example/]
legacylinks: [https://old.example/]
caps:
  modes:
    search: [q]
search:
  rows:
    selector: tr
  fields:
    title:
      selector: a
`);

describe('siteLinkFor', () => {
  it('uses the address chosen, ending it in a slash', () => {
    expect(DEFINITION === null ? '' : siteLinkFor(DEFINITION, 'https://mirror.example')).toBe(
      'https://mirror.example/',
    );
  });

  it('moves an old address to the current one', () => {
    expect(DEFINITION === null ? '' : siteLinkFor(DEFINITION, 'https://old.example/')).toBe(
      'https://new.example/',
    );
  });

  it('uses the first address where none was chosen', () => {
    expect(DEFINITION === null ? '' : siteLinkFor(DEFINITION, '')).toBe('https://new.example/');
  });
});
