import { describe, expect, it } from 'vitest';
import { BookMatchListSchema, BookMatchSchema } from './BookMatch';

const match = {
  openLibraryId: 12,
  title: 'Red Rising',
  author: 'Pierce Brown',
  year: 2014,
  coverUrl: null,
};

describe('BookMatchSchema', () => {
  it('reads a work Open Library holds', () => {
    expect(BookMatchSchema.parse(match)).toEqual(match);
  });

  it('refuses a work without a positive id', () => {
    expect(BookMatchSchema.safeParse({ ...match, openLibraryId: 0 }).success).toBe(false);
  });

  it('reads a list of them', () => {
    expect(BookMatchListSchema.parse({ matches: [match] }).matches).toHaveLength(1);
  });
});
