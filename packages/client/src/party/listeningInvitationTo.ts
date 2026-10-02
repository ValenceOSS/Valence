import { HOME, writeLocation } from '@ValenceClient/navigation/readLocation';

/**
 * The address that puts somebody else in this listening party.
 *
 * It opens the music section rather than any one song, because what the party plays is the host's
 * to change, and the song playing when the link was copied may be long over by the time it is
 * opened. Built from the writer the address bar uses, so it reads back as the party it names.
 *
 * @param partyId - The party being joined.
 * @param origin - Where this instance is reached from wherever the invitation is going.
 * @returns The address to send.
 */
const listeningInvitationTo = (partyId: string, origin: string): string =>
  `${origin}${writeLocation({ ...HOME, section: 'music', party: partyId })}`;

export { listeningInvitationTo };
