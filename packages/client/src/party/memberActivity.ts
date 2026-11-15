import type { PartyMember, WatchParty } from '@ValenceContracts/schemas/WatchParty';

type MemberActivity = 'doing' | 'paused' | 'notDoing';

/**
 * What somebody in a party is doing: watching or listening along, paused with everybody while the
 * party is paused, or stopped while it carries on without them, which is the one worth noticing.
 *
 * @param member - Who.
 * @param party - The party they are in.
 * @returns Which of the three.
 */
const memberActivity = (
  member: Pick<PartyMember, 'isWatching'>,
  party: Pick<WatchParty, 'isPlaying'>,
): MemberActivity => {
  if (member.isWatching) {
    return 'doing';
  }

  return party.isPlaying ? 'notDoing' : 'paused';
};

export type { MemberActivity };

export { memberActivity };
