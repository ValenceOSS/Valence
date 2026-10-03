import type {
  FederationAction,
  FederationActivity,
  LinkSharing,
  LinkSharingChange,
  RemotePerson,
  SharedLibrary,
  TheirActivity,
  TheirLibraries,
} from '@ValenceContracts/schemas/LinkSharing';
import type { ClaimedTitle } from './createPeerClaims';
import type { LinkPerson } from './LinkPerson';
import type { PeerItem } from './PeerItem';

type FederationRequest = {
  method: string;
  path: string;
  authorization: string | undefined;
};

type FederationRefusalCode =
  | 'error.linking.notSignedByALinkedServer'
  | 'error.linking.thatIsNotSharedWithYourServer'
  | 'error.linking.thatServerDoesNotShowItsRecord'
  | 'error.linking.thisPersonMayNotWatchFromHere'
  | 'error.linking.yourServerIsAskingTooOften';

type Admission =
  | { kind: 'pairing' }
  | {
      kind: 'admitted';
      serverId: string;
      personId: string | null;
      action: FederationAction;
      inner: string | null;
      libraryId: string | null;
      title: ClaimedTitle;
      serverName: string;
      personName: string | null;
      sharing: LinkSharing | null;
    }
  | { kind: 'refused'; status: 401 | 403 | 429; code: FederationRefusalCode };

type SharingChange =
  { kind: 'changed'; sharing: LinkSharing } | { kind: 'noSuchServer' } | { kind: 'noSuchLibrary' };

type LinkSharingService = {
  admit: (request: FederationRequest) => Promise<Admission>;
  sharedWith: (serverId: string) => Promise<SharedLibrary[]>;
  subjectOfTitle: (mediaId: string) => Promise<PeerItem | null>;
  activityFor: (serverId: string, since?: Date) => Promise<FederationActivity[] | null>;
  sharingOf: (id: string) => Promise<LinkSharing | null>;
  changeSharing: (id: string, change: LinkSharingChange) => Promise<SharingChange>;
  people: (id: string) => Promise<RemotePerson[] | null>;
  block: (id: string, personId: string, isBlocked: boolean) => Promise<RemotePerson | null>;
  activity: (id: string) => Promise<FederationActivity[] | null>;
  theirLibraries: (id: string) => Promise<TheirLibraries | null>;
  theirActivity: (id: string) => Promise<TheirActivity | null>;
  askAs: (id: string, person: LinkPerson) => Promise<{ address: string; token: string } | null>;
};

export type {
  Admission,
  FederationRefusalCode,
  FederationRequest,
  LinkSharingService,
  SharingChange,
};
