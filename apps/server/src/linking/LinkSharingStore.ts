import type {
  FederationAction,
  FederationActivity,
  FederationOutcome,
  LinkSharing,
  LinkSharingChange,
  RemotePerson,
} from '@ValenceContracts/schemas/LinkSharing';

type AuditEntry = {
  linkedServerId: string;
  remotePersonId: string | null;
  action: FederationAction;
  mediaId: string | null;
  mediaTitle: string | null;
  outcome: FederationOutcome;
};

type ActivityQuery = {
  since?: Date;
  personIds?: readonly string[];
  limit: number;
};

type LinkSharingStore = {
  readSharing: (linkedServerId: string) => Promise<LinkSharing | null>;
  changeSharing: (linkedServerId: string, change: LinkSharingChange) => Promise<LinkSharing | null>;
  seePerson: (
    linkedServerId: string,
    pseudonym: string,
    name: string | null,
    now: Date,
  ) => Promise<RemotePerson>;
  listPeople: (linkedServerId: string) => Promise<RemotePerson[]>;
  pseudonymOf: (linkedServerId: string, personId: string) => Promise<string | null>;
  blockPerson: (
    linkedServerId: string,
    personId: string,
    blockedAt: Date | null,
  ) => Promise<RemotePerson | null>;
  record: (entry: AuditEntry, now: Date) => Promise<void>;
  listActivity: (linkedServerId: string, query: ActivityQuery) => Promise<FederationActivity[]>;
};

export type { ActivityQuery, AuditEntry, LinkSharingStore };
