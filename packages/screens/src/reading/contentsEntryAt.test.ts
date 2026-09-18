import { describe, expect, it } from 'vitest';
import { contentsEntryAt } from './contentsEntryAt';

const CONTENTS = [
  { title: 'Chapter I.', part: 0, anchor: null, depth: 0 },
  { title: 'Chapter II.', part: 1, anchor: 'c2', depth: 0 },
  { title: 'Chapter III.', part: 1, anchor: 'c3', depth: 0 },
  { title: 'Chapter IV.', part: 2, anchor: null, depth: 0 },
];

describe('contentsEntryAt', () => {
  it('finds the entry a part begins with', () => {
    expect(contentsEntryAt(CONTENTS, 0, 4, new Map())).toBe(0);
  });

  it('finds the entry whose place is on or before the page showing', () => {
    const pages = new Map([
      ['c2', 0],
      ['c3', 6],
    ]);

    expect(contentsEntryAt(CONTENTS, 1, 5, pages)).toBe(1);
    expect(contentsEntryAt(CONTENTS, 1, 6, pages)).toBe(2);
  });

  it('takes a place not yet found to start with its part', () => {
    expect(contentsEntryAt(CONTENTS, 1, 0, new Map())).toBe(2);
  });

  it('finds nothing before the first entry', () => {
    expect(
      contentsEntryAt([{ title: 'Late', part: 3, anchor: null, depth: 0 }], 0, 0, new Map()),
    ).toBeNull();
  });
});
