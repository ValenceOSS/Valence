import { describe, expect, it } from 'vitest';
import { describeAskers } from './describeAskers';

const PRIYA = { id: 'p', name: 'Priya' };
const SAM = { id: 's', name: 'Sam' };
const ALI = { id: 'a', name: 'Ali' };

describe('describeAskers', () => {
  it('says you alone asked', () => {
    expect(describeAskers([PRIYA], { accountId: 'p', profileId: null })).toBe('Requested by you');
  });

  it('names whoever else asked with you', () => {
    expect(describeAskers([SAM, PRIYA], { accountId: 'p', profileId: null })).toBe(
      'Requested by you and Sam',
    );
  });

  it('names everybody who asked, where you did not', () => {
    expect(describeAskers([PRIYA, SAM, ALI], { accountId: 'x', profileId: null })).toBe(
      'Requested by Priya, Sam and Ali',
    );
  });

  it('names somebody else on your own account by their profile, and tells you apart from them', () => {
    const dad = {
      id: 'home',
      name: 'The Smiths',
      askingProfile: { profileId: 'dad', name: 'Dad' },
    };
    const kid = {
      id: 'home',
      name: 'The Smiths',
      askingProfile: { profileId: 'kid', name: 'Kid' },
    };

    expect(describeAskers([dad, kid], { accountId: 'home', profileId: 'kid' })).toBe(
      'Requested by you and Dad',
    );
  });

  it('names a profile on another account with its household', () => {
    const dad = {
      id: 'home',
      name: 'The Smiths',
      askingProfile: { profileId: 'dad', name: 'Dad' },
    };

    expect(describeAskers([dad], { accountId: 'away', profileId: 'x' })).toBe(
      'Requested by Dad from The Smiths',
    );
  });
});
