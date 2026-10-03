import type {
  LinkIdentity,
  LinkIdentityChange,
  LinkedServer,
  Linking,
  MadeLinkInvite,
  PairAnswer,
  PairRequest,
  ServerIdentity,
} from '@ValenceContracts/schemas/LinkedServer';
import type { LinkTokenPerson, LinkTokenSigner } from './LinkTokenPerson';

type InviteRefusal =
  | 'notAnInvite'
  | 'itself'
  | 'alreadyLinked'
  | 'unreachable'
  | 'notTheServerThatInvited'
  | 'inviteSpent';

type PairRefusal = 'itself' | 'alreadyLinked' | 'inviteSpent';

type LinkService = {
  identity: () => Promise<LinkIdentity>;
  readToken: (token: string) => Promise<LinkTokenSigner | null>;
  signFor: (
    id: string,
    person?: LinkTokenPerson,
  ) => Promise<{ address: string; token: string } | null>;
  pseudonymFor: (id: string, profileId: string) => Promise<string>;
  publicIdentity: () => Promise<ServerIdentity>;
  changeIdentity: (change: LinkIdentityChange) => Promise<LinkIdentity>;
  linking: () => Promise<Linking>;
  makeInvite: () => Promise<MadeLinkInvite>;
  withdrawInvite: (id: string) => Promise<boolean>;
  useInvite: (
    invite: string,
  ) => Promise<{ kind: 'used'; server: LinkedServer } | { kind: 'refused'; why: InviteRefusal }>;
  approve: (id: string) => Promise<LinkedServer | null>;
  refuse: (id: string) => Promise<LinkedServer | null>;
  check: (id: string) => Promise<LinkedServer | null>;
  unlink: (id: string) => Promise<boolean>;
  pair: (
    request: PairRequest,
  ) => Promise<{ kind: 'paired'; answer: PairAnswer } | { kind: 'refused'; why: PairRefusal }>;
  pairingState: (pairingId: string, token: string) => Promise<PairAnswer | null>;
  hearUnlinked: (token: string) => Promise<boolean>;
};

export type { InviteRefusal, LinkService, PairRefusal };
