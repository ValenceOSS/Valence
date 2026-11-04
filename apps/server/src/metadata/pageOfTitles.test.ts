import { describe, expect, it } from 'vitest';
import { aListedFile } from '@ValenceServer/testing/aListedFile';
import { listedTitlesOf } from './listedTitlesOf';
import type { TitleListQuery } from '@ValenceContracts/schemas/TitleList';
import { pageOfTitles } from './pageOfTitles';

const titles = listedTitlesOf(
  ['a', 'b', 'c', 'd', 'e'].map((id) => aListedFile(id, { summary: { title: id } })),
  { duplicates: new Map(), duplicatePaths: new Map(), editedKeys: new Set() },
);

const ASKED: TitleListQuery = {
  libraryId: 'lib',
  sort: 'title',
  desc: false,
  show: 'all',
  filter: [],
};

describe('pageOfTitles', () => {
  it('reads a page at a time, each carrying on where the last stopped, until none are left', () => {
    const first = pageOfTitles(titles, ASKED, undefined, 2, 0);
    const second = pageOfTitles(titles, ASKED, first.next ?? undefined, 2, 0);
    const third = pageOfTitles(titles, ASKED, second.next ?? undefined, 2, 0);

    expect(first.titles.map((one) => one.name)).toEqual(['a', 'b']);
    expect(second.titles.map((one) => one.name)).toEqual(['c', 'd']);
    expect(third.titles.map((one) => one.name)).toEqual(['e']);
    expect(third.next).toBeNull();
    expect(first.total).toBe(5);
  });

  it('starts at the top where the cursor cannot be read', () => {
    expect(pageOfTitles(titles, ASKED, 'nonsense', 2, 0).titles.map((one) => one.name)).toEqual([
      'a',
      'b',
    ]);
  });
});
