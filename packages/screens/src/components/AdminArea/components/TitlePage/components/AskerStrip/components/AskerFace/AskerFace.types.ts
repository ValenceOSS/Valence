import type { Account } from '@ValenceContracts/schemas/Account';
import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

type AskerFaceProps = {
  asker: Requester;
  accounts: readonly Account[];
  size: 'sm' | 'md';
};

export type { AskerFaceProps };
