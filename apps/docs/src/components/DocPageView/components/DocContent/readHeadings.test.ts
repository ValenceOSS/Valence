import { describe, expect, it } from 'vitest';
import { readHeadings } from '@ValenceDocs/components/DocPageView/components/DocContent/readHeadings';

describe('readHeadings', () => {
  it('lists the second and third level headings that have an anchor, without the anchor link text', () => {
    const root = document.createElement('div');

    root.innerHTML =
      '<h2 id="a">First#</h2><h3 id="b">Nested</h3><h4 id="c">Deeper</h4><h2>No anchor</h2>';

    expect(readHeadings(root)).toEqual([
      { id: 'a', text: 'First', level: 2 },
      { id: 'b', text: 'Nested', level: 3 },
    ]);
  });
});
