import { describe, expect, it } from 'vitest';
import { findNeighbours } from '@ValenceDocs/content/findNeighbours';

const sections = [
  { id: 'a', title: 'A', items: [{ path: '/a/1', title: 'One', order: 1 }] },
  {
    id: 'b',
    title: 'B',
    items: [
      { path: '/b/1', title: 'Two', order: 1 },
      { path: '/b/2', title: 'Three', order: 2 },
    ],
  },
];

describe('findNeighbours', () => {
  it('reads across sections as one list', () => {
    expect(findNeighbours(sections, '/b/1')).toEqual({
      previous: sections[0]?.items[0],
      next: sections[1]?.items[1],
    });
  });

  it('has nothing before the first page or after the last', () => {
    expect(findNeighbours(sections, '/a/1').previous).toBeNull();
    expect(findNeighbours(sections, '/b/2').next).toBeNull();
  });

  it('has no neighbours for a page it does not know', () => {
    expect(findNeighbours(sections, '/nowhere')).toEqual({ previous: null, next: null });
  });
});
