import type { PeerClaimKind } from './FederationReach';

type ClaimedTitle = { mediaId: string | null; title: string | null };

type PeerClaims = {
  claim: (kind: PeerClaimKind, id: string, serverId: string, of: ClaimedTitle) => void;
  claimedBy: (kind: PeerClaimKind, id: string, serverId: string) => ClaimedTitle | null;
  release: (kind: PeerClaimKind, id: string, serverId: string) => void;
  countOf: (kind: PeerClaimKind, serverId: string) => number;
};

/**
 * Remembers which linked server started which playback session or set of thumbnails here, and of
 * which title, so the addresses a manifest points at — which name a session and nothing else —
 * reach only the server that started it, as a share link's sessions reach only that link, and the
 * record can still say what was being watched.
 *
 * Counted, so a player that opens the same session twice before closing the first is not cut off
 * when it does. Held in memory, since a session ends with a restart anyway.
 *
 * @returns The registry.
 */
const createPeerClaims = (): PeerClaims => {
  const claims = new Map<string, { count: number; of: ClaimedTitle }>();
  const keyOf = (kind: PeerClaimKind, id: string, serverId: string) =>
    `${kind}\n${id}\n${serverId}`;

  return {
    claim: (kind, id, serverId, of) => {
      const key = keyOf(kind, id, serverId);

      claims.set(key, { count: (claims.get(key)?.count ?? 0) + 1, of });
    },

    claimedBy: (kind, id, serverId) => claims.get(keyOf(kind, id, serverId))?.of ?? null,

    countOf: (kind, serverId) =>
      [...claims.keys()].filter((key) => {
        const [claimed, , server] = key.split('\n');

        return claimed === kind && server === serverId;
      }).length,

    release: (kind, id, serverId) => {
      const key = keyOf(kind, id, serverId);
      const held = claims.get(key);

      if (held !== undefined && held.count > 1) {
        claims.set(key, { ...held, count: held.count - 1 });
      } else {
        claims.delete(key);
      }
    },
  };
};

export type { ClaimedTitle, PeerClaims };

export { createPeerClaims };
