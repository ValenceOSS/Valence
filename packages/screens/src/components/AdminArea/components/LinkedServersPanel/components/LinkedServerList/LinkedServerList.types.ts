import type { LinkedServer } from '@ValenceContracts/schemas/LinkedServer';

type LinkedServerListProps = {
  servers: readonly LinkedServer[];
  managing: string | null;
  onManage: (id: string | null) => void;
};

export type { LinkedServerListProps };
