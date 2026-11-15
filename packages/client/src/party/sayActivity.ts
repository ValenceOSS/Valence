import { memberActivity } from './memberActivity';
import type { PartyWords } from './PARTY_WORDS';
import type { PartyMember, WatchParty } from '@ValenceContracts/schemas/WatchParty';

/**
 * What somebody in a party is doing, in the words of its kind of party.
 *
 * @param member - Who.
 * @param party - The party they are in.
 * @param words - How this kind of party says it.
 * @returns Watching or listening, paused, or not along.
 */
const sayActivity = (
  member: Pick<PartyMember, 'isWatching'>,
  party: Pick<WatchParty, 'isPlaying'>,
  words: Pick<PartyWords, 'isDoing' | 'isPaused' | 'notDoing'>,
): string => {
  const activity = memberActivity(member, party);

  return activity === 'doing'
    ? words.isDoing
    : activity === 'paused'
      ? words.isPaused
      : words.notDoing;
};

export { sayActivity };
