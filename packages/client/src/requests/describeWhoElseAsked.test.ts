import { describe, expect, it } from 'vitest';
import { describeWhoElseAsked } from './describeWhoElseAsked';

const PRIYA = { id: 'p', name: 'Priya' };
const SAM = { id: 's', name: 'Sam' };

describe('describeWhoElseAsked', () => {
  it('says nothing where only you asked, or nobody did', () => {
    expect(describeWhoElseAsked([PRIYA], 'p')).toBeNull();
    expect(describeWhoElseAsked([], 'p')).toBeNull();
  });

  it('says who wants it too, where you asked', () => {
    expect(describeWhoElseAsked([SAM, PRIYA], 'p')).toBe('Sam wants it too');
    expect(describeWhoElseAsked([SAM, PRIYA, { id: 'a', name: 'Ali' }], 'p')).toBe(
      'Sam and Ali want it too',
    );
  });

  it('says who asked, where you did not', () => {
    expect(describeWhoElseAsked([PRIYA, SAM], 'x')).toBe('Requested by Priya and Sam');
  });
});
