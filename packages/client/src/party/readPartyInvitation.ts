const TO_WATCH = /^\/watch\/([^/?#]+)\?(?:[^#]*&)?party=([^&#]+)/u;

const TO_LISTEN = /^\/music\?(?:[^#]*&)?party=([^&#]+)/u;

type PartyInvitation =
  | { kind: 'watch'; partyId: string; mediaId: string }
  | { kind: 'listen'; partyId: string };

/**
 * Which party an invitation asks somebody into, read from the link the server wrote for it — a
 * film or programme to watch together, or music to listen along to — so a client without the web's
 * addresses can open it where it belongs.
 *
 * @param link - The invitation's link.
 * @returns The party and what it is of, or nothing where the link is no invitation.
 */
const readPartyInvitation = (link: string | null): PartyInvitation | null => {
  if (link === null) {
    return null;
  }

  const watching = TO_WATCH.exec(link);
  const [, mediaId, watchParty] = watching ?? [];

  if (mediaId !== undefined && watchParty !== undefined) {
    return {
      kind: 'watch',
      mediaId: decodeURIComponent(mediaId),
      partyId: decodeURIComponent(watchParty),
    };
  }

  const [, listenParty] = TO_LISTEN.exec(link) ?? [];

  return listenParty === undefined
    ? null
    : { kind: 'listen', partyId: decodeURIComponent(listenParty) };
};

export type { PartyInvitation };

export { readPartyInvitation };
