import { describe, expect, it } from 'vitest';
import { scoreOfMatch } from './scoreOfMatch';

describe('scoreOfMatch', () => {
  it('scores the same name and year as a perfect fit, however it is written', () => {
    expect(
      scoreOfMatch({ title: 'the matrix', year: 1999 }, { title: 'The Matrix', year: 1999 }),
    ).toBe(100);
    expect(
      scoreOfMatch({ title: 'Law & Order', year: null }, { title: 'Law and Order', year: 1990 }),
    ).toBe(100);
    expect(scoreOfMatch({ title: 'Amélie', year: null }, { title: 'Amelie', year: 2001 })).toBe(
      100,
    );
  });

  it('scores a name sharing some words, or a year off, lower', () => {
    expect(
      scoreOfMatch(
        { title: 'The Matrix', year: 1999 },
        { title: 'The Matrix Reloaded', year: 2003 },
      ),
    ).toBe(53);
    expect(
      scoreOfMatch({ title: 'The Matrix', year: 1999 }, { title: 'The Matrix', year: 2000 }),
    ).toBe(90);
    expect(scoreOfMatch({ title: 'Heat', year: null }, { title: 'Cold', year: null })).toBe(0);
  });
});
