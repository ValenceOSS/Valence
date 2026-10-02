import type { Account } from '@ValenceContracts/schemas/Account';
import type { IssuedSetupLink } from '@ValenceContracts/schemas/SetupLink';

type SetupLinkSectionProps = {
  account: Account;
  held: IssuedSetupLink | null;
  canEmail: boolean;
  onHeld: (link: IssuedSetupLink | null) => void;
  onChanged: () => Promise<void>;
};

export type { SetupLinkSectionProps };
