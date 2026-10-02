import { describe, expect, it } from 'vitest';
import { whoCanBeAsked } from './whoCanBeAsked';
import { aPartyMember } from '@ValenceClient/testing/aPartyMember';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';

describe('whoCanBeAsked', () => {
  it('leaves out whoever is already there, by profile or by account', () => {
    const party = aWatchParty({
      members: [
        aPartyMember({ profileId: 'jo' }),
        aPartyMember({ connectionId: 'c-2', accountId: 'acc-kim' }),
      ],
    });

    expect(
      whoCanBeAsked(party, [
        { id: 'jo', name: 'Jo' },
        { id: 'kim', name: 'Kim', accountId: 'acc-kim' },
        { id: 'ash', name: 'Ash' },
      ]).map((person) => person.name),
    ).toEqual(['Ash']);
  });
});
