import { describe, expect, it } from 'vitest';
import { nameOfAsker } from './nameOfAsker';

describe('nameOfAsker', () => {
  it('names a profile from its household', () => {
    expect(nameOfAsker({ profileName: 'Kid', household: 'The Smiths' })).toBe(
      'Kid from The Smiths',
    );
  });

  it('names somebody once where the profile and the household share a name', () => {
    expect(nameOfAsker({ profileName: 'Priya', household: 'Priya' })).toBe('Priya');
  });

  it('names the profile alone where the household is not known', () => {
    expect(nameOfAsker({ profileName: 'Kid', household: null })).toBe('Kid');
  });

  it('names the household alone where the profile is not known', () => {
    expect(nameOfAsker({ profileName: null, household: 'The Smiths' })).toBe('The Smiths');
    expect(nameOfAsker({ profileName: undefined, household: 'The Smiths' })).toBe('The Smiths');
  });

  it('names nobody where neither is known', () => {
    expect(nameOfAsker({ profileName: null, household: null })).toBe('');
  });
});
