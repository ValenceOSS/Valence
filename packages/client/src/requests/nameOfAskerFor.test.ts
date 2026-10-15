import { describe, expect, it } from 'vitest';
import { nameOfAskerFor } from './nameOfAskerFor';

const KID_OF_THE_SMITHS = {
  id: 'smiths',
  name: 'The Smiths',
  askingProfile: { profileId: 'p-kid', name: 'Kid' },
};

describe('nameOfAskerFor', () => {
  it('names a profile on the looker’s own account by its name alone', () => {
    expect(nameOfAskerFor(KID_OF_THE_SMITHS, { accountId: 'smiths', profileId: 'p-parent' })).toBe(
      'Kid',
    );
    expect(nameOfAskerFor(KID_OF_THE_SMITHS, { accountId: 'smiths', profileId: null })).toBe('Kid');
  });

  it('names a profile on somebody else’s account as the profile from its household', () => {
    expect(nameOfAskerFor(KID_OF_THE_SMITHS, { accountId: 'joneses', profileId: 'p-x' })).toBe(
      'Kid from The Smiths',
    );
  });

  it('names a profile from its household where nobody is looking', () => {
    expect(nameOfAskerFor(KID_OF_THE_SMITHS, null)).toBe('Kid from The Smiths');
  });

  it('names an asker recorded without a profile by its household, whoever is looking', () => {
    const smiths = { id: 'smiths', name: 'The Smiths' };

    expect(nameOfAskerFor(smiths, { accountId: 'smiths', profileId: 'p-kid' })).toBe('The Smiths');
    expect(nameOfAskerFor({ ...smiths, askingProfile: null }, null)).toBe('The Smiths');
  });

  it('names somebody once where their profile and household share a name', () => {
    expect(
      nameOfAskerFor(
        { id: 'priya', name: 'Priya', askingProfile: { profileId: 'p-priya', name: 'Priya' } },
        null,
      ),
    ).toBe('Priya');
  });
});
