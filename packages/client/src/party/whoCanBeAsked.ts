import type { WatchParty } from '@ValenceContracts/schemas/WatchParty';

type Askable = {
  id: string;
  name: string;
  accountId?: string;
};

/**
 * Everybody in the household who is not already in the party, and so could be asked along.
 *
 * @param party - The party.
 * @param people - Everybody with an account here.
 * @returns Those not in it, in the order given.
 */
const whoCanBeAsked = (party: WatchParty, people: readonly Askable[]): readonly Askable[] =>
  people.filter(
    (person) =>
      !party.members.some(
        (member) => member.profileId === person.id || member.accountId === person.accountId,
      ),
  );

export type { Askable };

export { whoCanBeAsked };
