import { describe, expect, it } from 'vitest';
import { countsOf } from './countsOf';

describe('countsOf', () => {
  it('counts the rows in each group, each row once per group', () => {
    expect(countsOf([['a', 'a', 'b'], ['b'], []], (row) => row)).toStrictEqual(
      new Map([
        ['a', 1],
        ['b', 2],
      ]),
    );
  });
});
