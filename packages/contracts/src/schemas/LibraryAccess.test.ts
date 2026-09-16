import { describe, expect, it } from 'vitest';
import { LibraryAccessSchema, describeCeiling, wouldLeaveNothing } from './LibraryAccess';

const FILMS = '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f';
const SHOWS = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const shelf = (id: string, mayView: boolean) => ({
  id,
  name: id,
  mayView,
  maximumAge: null,
  allowsUnrated: false,
});

describe('what an account may reach', () => {
  it('reads a library and whether this account sees it', () => {
    const parsed = LibraryAccessSchema.parse({
      libraries: [
        { id: FILMS, name: 'Films', mayView: true, maximumAge: 15, allowsUnrated: false },
      ],
    });

    expect(parsed.libraries[0]?.mayView).toBe(true);
  });

  it('refuses a library that is not identified', () => {
    expect(() =>
      LibraryAccessSchema.parse({
        libraries: [
          { id: 'films', name: 'Films', mayView: true, maximumAge: null, allowsUnrated: false },
        ],
      }),
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

describe('how a ceiling reads', () => {
  it('says plainly when there is none', () => {
    expect(describeCeiling(null)).toBe('No ceiling');
  });

  it('writes out the strictest one rather than leaving a zero to look like nothing', () => {
    expect(describeCeiling(0)).toBe('Suitable for all');
  });

  it('names the age otherwise', () => {
    expect(describeCeiling(12)).toBe('Up to 12');
    expect(describeCeiling(18)).toBe('Up to 18');
  });
});
