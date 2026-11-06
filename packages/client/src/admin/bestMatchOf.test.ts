import { describe, expect, it } from 'vitest';
import { bestMatchOf } from './bestMatchOf';

describe('bestMatchOf', () => {
  it('takes the entry that fits far ahead of the rest', () => {
    const picked = bestMatchOf({ title: 'A Long Title', year: 2001 }, [
      { title: 'A Long Title', year: 2001 },
      { title: 'Another Title', year: 1990 },
    ]);

    expect(picked?.entry).toEqual({ title: 'A Long Title', year: 2001 });
  });

  it('leaves it to a person where two fit about as well, or none fits well', () => {
    expect(
      bestMatchOf({ title: 'A Title', year: null }, [
        { title: 'A Title', year: 2001 },
        { title: 'A Title', year: 2010 },
      ]),
    ).toBeNull();
    expect(
      bestMatchOf({ title: 'Something', year: null }, [{ title: 'Else', year: 1 }]),
    ).toBeNull();
    expect(bestMatchOf({ title: 'Something', year: null }, [])).toBeNull();
  });
});
