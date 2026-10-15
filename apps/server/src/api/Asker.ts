import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { AskingProfile } from '@ValenceContracts/schemas/MediaRequest';

type Asker = {
  account: () => Promise<{ id: string; name: string } | null>;
  holds: (permission: Permission) => Promise<boolean>;
  askingProfile?: () => Promise<AskingProfile | null>;
};

export type { Asker };
