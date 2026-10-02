import type { Permission } from '@ValenceContracts/schemas/Permission';

type Asker = {
  account: () => Promise<{ id: string; name: string } | null>;
  holds: (permission: Permission) => Promise<boolean>;
};

export type { Asker };
