import type { Account } from '@ValenceContracts/schemas/Account';

type AccountStandingProps = {
  account: Account;
  now: number;
  hasDetail?: boolean;
};

export type { AccountStandingProps };
