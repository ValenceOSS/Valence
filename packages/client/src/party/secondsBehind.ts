import { whereTheRoomIs } from '@ValenceCore/functions/whereTheRoomIs';
import type { PartyMember } from '@ValenceContracts/schemas/WatchParty';

/**
 * How far behind whoever keeps time somebody in a party is, in seconds, with both carried forward
 * to the same instant first.
 *
 * Both positions were measured at different moments, and comparing them as they stand would report
 * the gap between two readings taken a second apart as though it were drift between two players.
 *
 * @param member - The member being measured.
 * @param reference - Whoever is keeping time.
 * @returns How far behind, negative where they are ahead.
 */
const secondsBehind = (member: PartyMember, reference: PartyMember): number => {
  const atMs = Math.max(member.reportedAtMs, reference.reportedAtMs);

  return whereTheRoomIs(reference, atMs) - whereTheRoomIs(member, atMs);
};

export { secondsBehind };
