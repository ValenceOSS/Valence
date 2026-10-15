import { describe, expect, it } from 'vitest';
import { othersAskingOf } from './othersAskingOf';

const PRIYA = { id: 'p', name: 'Priya' };
const SAM = { id: 's', name: 'Sam' };
const KID = { id: 'p', name: 'Priya', askingProfile: { profileId: 'p-kid', name: 'Kid' } };
const PARENT = { id: 'p', name: 'Priya', askingProfile: { profileId: 'p-parent', name: 'Parent' } };

describe('othersAskingOf', () => {
  it('is nothing where nobody else asked', () => {
    expect(othersAskingOf([PRIYA], { accountId: 'p', profileId: null })).toBeNull();
  });

  it('names and counts the others', () => {
    expect(
      othersAskingOf([PRIYA, SAM, { id: 'a', name: 'Ali' }], { accountId: 'p', profileId: null }),
    ).toEqual({
      names: 'Sam and Ali',
      count: 2,
    });
  });

  it('counts another profile on the looker’s own account among the others, by its name alone', () => {
    expect(othersAskingOf([KID, PARENT, SAM], { accountId: 'p', profileId: 'p-kid' })).toEqual({
      names: 'Parent and Sam',
      count: 2,
    });
  });

  it('is nothing where only the looker’s own profile asked', () => {
    expect(othersAskingOf([KID], { accountId: 'p', profileId: 'p-kid' })).toBeNull();
  });

  it('takes an asker recorded without a profile as the looker, whichever profile is looking', () => {
    expect(othersAskingOf([PRIYA, SAM], { accountId: 'p', profileId: 'p-parent' })).toEqual({
      names: 'Sam',
      count: 1,
    });
  });

  it('names everybody from their households where nobody is looking', () => {
    expect(othersAskingOf([KID, PARENT], null)).toEqual({
      names: 'Kid from Priya and Parent from Priya',
      count: 2,
    });
  });
});
