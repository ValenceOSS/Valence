import type { FederationAction } from '@ValenceContracts/schemas/LinkSharing';

type PeerSubject = { kind: 'item' | 'book' | 'album' | 'artist'; id: string };

type PeerClaimKind = 'session' | 'trickplay';

type FederationReach =
  | { kind: 'pairing' }
  | { kind: 'ticket' }
  | { kind: 'server'; action: FederationAction }
  | { kind: 'catalogue'; action: FederationAction; libraryId: string }
  | { kind: 'subject'; action: FederationAction; subject: PeerSubject; inner: string }
  | { kind: 'claimed'; action: FederationAction; claim: PeerClaimKind; id: string; inner: string }
  | { kind: 'refused' };

export type { FederationReach, PeerClaimKind, PeerSubject };
