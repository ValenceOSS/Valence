import type { LinkInvite, LinkedServer } from '@ValenceContracts/schemas/LinkedServer';

type LinkedServerListProps = {
  servers: readonly LinkedServer[];
  invites: readonly LinkInvite[];
  onOpen: (id: string) => void;
};

export type { LinkedServerListProps };
