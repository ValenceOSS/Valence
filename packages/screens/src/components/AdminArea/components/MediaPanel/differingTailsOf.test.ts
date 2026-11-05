import { describe, expect, it } from 'vitest';
import { differingTailsOf } from './differingTailsOf';

describe('differingTailsOf', () => {
  it('drops the folders two paths share', () => {
    expect(
      differingTailsOf('/lib/Show/Season 01/a.mkv', '/lib/Show/Season 01/A - S01E01.mkv'),
    ).toEqual({
      from: 'a.mkv',
      to: 'A - S01E01.mkv',
    });
    expect(differingTailsOf('C:\\lib\\film.mkv', 'C:\\lib\\Film (2001)\\Film (2001).mkv')).toEqual({
      from: 'film.mkv',
      to: 'Film (2001)/Film (2001).mkv',
    });
  });
});
