import { describe, expect, it } from 'vitest';
import { parseName } from './parseName';

describe('parseName', () => {
  it('takes the year off and cuts the release noise after it', () => {
    expect(parseName('Heat.1995.1080p.BluRay.x264-GRP')).toEqual({ name: 'Heat', year: 1995 });
  });

  it('cuts noise from a name that has no year', () => {
    expect(parseName('Movie.Name.1080p.WEB-DL')).toEqual({ name: 'Movie.Name', year: null });
  });

  it('keeps a title that is a number', () => {
    expect(parseName('1917')).toEqual({ name: '1917', year: null });
  });
});
