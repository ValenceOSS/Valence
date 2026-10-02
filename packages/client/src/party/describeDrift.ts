import { secondsBehind } from '@ValenceClient/party/secondsBehind';
import type { PartyMember } from '@ValenceContracts/schemas/WatchParty';
import { say } from '@ValenceI18n/say';

const WORTH_SAYING_SECONDS = 1;

/**
 * How far somebody in a watch party is from whoever keeps time, said in a way worth reading.
 *
 * @param member - The member being described.
 * @param reference - Whoever is keeping time.
 * @returns A short phrase, or null where they are close enough for it not to be worth saying.
 */
const describeDrift = (member: PartyMember, reference: PartyMember): string | null => {
  const behind = secondsBehind(member, reference);
  const seconds = Math.abs(behind).toFixed(1);

  if (Math.abs(behind) < WORTH_SAYING_SECONDS) {
    return null;
  }

  return behind > 0
    ? say('common.partyPanel.secondsBehind', { seconds })
    : say('common.partyPanel.secondsAhead', { seconds });
};

export { describeDrift };
