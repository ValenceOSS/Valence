import { describe, expect, it } from 'vitest';
import { DaySchema, FIELDS_OF_KIND, TITLE_FIELD_SCHEMAS } from './TitleEdit';

describe('TitleEdit', () => {
  it('takes a real date, in the years a title’s year may be', () => {
    expect(DaySchema.safeParse('2001-05-04').success).toBe(true);
    expect(DaySchema.safeParse('2001-02-29').success).toBe(false);
    expect(DaySchema.safeParse('1869-12-31').success).toBe(false);
    expect(DaySchema.safeParse('4 May 2001').success).toBe(false);
  });

  it('never lets a title be emptied, which would stop older apps reading it', () => {
    expect(TITLE_FIELD_SCHEMAS.title.safeParse('').success).toBe(false);
    expect(TITLE_FIELD_SCHEMAS.title.safeParse('  A film ').data).toBe('A film');
  });

  it('keeps ratings and scores in the ranges the apps read', () => {
    expect(TITLE_FIELD_SCHEMAS.rating.safeParse(10.5).success).toBe(false);
    expect(TITLE_FIELD_SCHEMAS.rottenTomatoes.safeParse(101).success).toBe(false);
    expect(TITLE_FIELD_SCHEMAS.certifications.safeParse({ gb: '15' }).success).toBe(false);
  });

  it('gives an episode only what an episode has', () => {
    expect(FIELDS_OF_KIND.episode).toEqual([
      'title',
      'overview',
      'releaseDate',
      'addedAt',
      'directors',
      'writers',
      'guestStars',
      'note',
    ]);
  });
});
