import { describe, expect, it } from 'vitest';
import { namesOfAskers } from './namesOfAskers';

const KID = {
  id: 'smiths',
  name: 'The Smiths',
  askingProfile: { profileId: 'p-kid', name: 'Kid' },
};
const PARENT = {
  id: 'smiths',
  name: 'The Smiths',
  askingProfile: { profileId: 'p-parent', name: 'Parent' },
};

describe('namesOfAskers', () => {
  it('names the first asker alone', () => {
    expect(namesOfAskers({ requestedBy: { id: 'p', name: 'Priya' }, alsoAskedBy: [] })).toBe(
      'Priya',
    );
  });

  it('names everybody who asked, the first first', () => {
    expect(
      namesOfAskers({
        requestedBy: { id: 'p', name: 'Priya' },
        alsoAskedBy: [
          { id: 's', name: 'Sam' },
          { id: 'a', name: 'Ali' },
        ],
      }),
    ).toBe('Priya, Sam and Ali');
  });

  it('tells two profiles on one account apart, each from its household', () => {
    expect(namesOfAskers({ requestedBy: KID, alsoAskedBy: [PARENT] })).toBe(
      'Kid from The Smiths and Parent from The Smiths',
    );
  });

  it('names the profiles on the looker’s own account by their names alone', () => {
    expect(
      namesOfAskers(
        { requestedBy: KID, alsoAskedBy: [PARENT, { id: 's', name: 'Sam' }] },
        { accountId: 'smiths', profileId: 'p-kid' },
      ),
    ).toBe('Kid, Parent and Sam');
  });

  it('names an asker recorded without a profile by its household', () => {
    expect(
      namesOfAskers(
        { requestedBy: { id: 'smiths', name: 'The Smiths' }, alsoAskedBy: [] },
        { accountId: 'smiths', profileId: 'p-kid' },
      ),
    ).toBe('The Smiths');
  });
});
