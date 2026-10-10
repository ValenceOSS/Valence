import type {
  LinkInvite,
  LinkState,
  LinkedServer,
  PublicServerKey,
} from '@ValenceContracts/schemas/LinkedServer';

type StoredLinkedServer = LinkedServer & {
  publicKey: PublicServerKey;
  theirPairingId: string | null;
};

type NewLinkedServer = {
  name: string;
  colour: string;
  address: string;
  publicKey: PublicServerKey;
  fingerprint: string;
  state: LinkState;
  theirPairingId: string | null;
};

type LinkedServerChange = {
  name?: string;
  colour?: string;
  address?: string;
  state?: LinkState;
  theirPairingId?: string | null;
  linkedAt?: Date | null;
  lastSeenAt?: Date;
};

type LinkStore = {
  listInvites: (now: Date) => Promise<LinkInvite[]>;
  addInvite: (codeHash: string, expiresAt: Date) => Promise<LinkInvite>;
  withdrawInvite: (id: string) => Promise<boolean>;
  spendInvite: (codeHash: string, now: Date) => Promise<boolean>;
  listServers: () => Promise<StoredLinkedServer[]>;
  readServer: (id: string) => Promise<StoredLinkedServer | null>;
  readServerByFingerprint: (fingerprint: string) => Promise<StoredLinkedServer | null>;
  addServer: (server: NewLinkedServer) => Promise<StoredLinkedServer>;
  changeServer: (id: string, change: LinkedServerChange) => Promise<StoredLinkedServer | null>;
  removeServer: (id: string) => Promise<boolean>;
  listDeclined: (id: string) => Promise<string[]>;
  declineLibrary: (id: string, libraryId: string, isDeclined: boolean) => Promise<void>;
};

export type { LinkStore, LinkedServerChange, NewLinkedServer, StoredLinkedServer };
