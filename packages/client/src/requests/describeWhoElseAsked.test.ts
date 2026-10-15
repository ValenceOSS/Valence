import { describe, expect, it } from 'vitest';
import { describeWhoElseAsked } from './describeWhoElseAsked';

const PRIYA = { id: 'p', name: 'Priya' };
const SAM = { id: 's', name: 'Sam' };

describe('describeWhoElseAsked', () => {
  it('says nothing where only you asked, or nobody did', () => {
    expect(describeWhoElseAsked([PRIYA], { accountId: 'p', profileId: null })).toBeNull();
    expect(describeWhoElseAsked([], { accountId: 'p', profileId: null })).toBeNull();
  });

  it('says who wants it too, where you asked', () => {
    expect(describeWhoElseAsked([SAM, PRIYA], { accountId: 'p', profileId: null })).toBe(
      'Sam wants it too',
    );
    expect(
      describeWhoElseAsked([SAM, PRIYA, { id: 'a', name: 'Ali' }], {
        accountId: 'p',
        profileId: null,
      }),
    ).toBe('Sam and Ali want it too');
  });

  it('says who asked, where you did not', () => {
    expect(describeWhoElseAsked([PRIYA, SAM], { accountId: 'x', profileId: null })).toBe(
      'Requested by Priya and Sam',
    );
  });
});
