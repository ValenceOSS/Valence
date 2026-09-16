import { describe, expect, it } from 'vitest';
import { LibraryAccessSchema, wouldLeaveNothing } from './LibraryAccess';

const FILMS = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';
const SHOWS = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const shelf = (id: string, mayView: boolean) => ({ id, name: id, mayView });

describe('what an account may reach', () => {
  it('reads a library and whether this account sees it', () => {
    const parsed = LibraryAccessSchema.parse({
      libraries: [{ id: FILMS, name: 'Films', mayView: true }],
    });

    expect(parsed.libraries[0]?.mayView).toBe(true);
  });

  it('refuses a library that is not identified', () => {
    expect(() =>
      LibraryAccessSchema.parse({ libraries: [{ id: 'films', name: 'Films', mayView: true }] }),
    ).toThrow();
  });
});

describe('taking away the last one', () => {
  it('says so when nothing would be left', () => {
    expect(wouldLeaveNothing([shelf(FILMS, true), shelf(SHOWS, false)], FILMS)).toBe(true);
  });

  it('says nothing where another remains', () => {
    expect(wouldLeaveNothing([shelf(FILMS, true), shelf(SHOWS, true)], FILMS)).toBe(false);
  });

  it('says nothing where the one being taken away was already gone', () => {
    expect(wouldLeaveNothing([shelf(FILMS, false), shelf(SHOWS, false)], FILMS)).toBe(false);
  });

  it('says nothing about a library that is not theirs to lose', () => {
    expect(wouldLeaveNothing([shelf(SHOWS, true)], FILMS)).toBe(false);
  });

  it('says nothing where there are no libraries at all', () => {
    expect(wouldLeaveNothing([], FILMS)).toBe(false);
  });
});
