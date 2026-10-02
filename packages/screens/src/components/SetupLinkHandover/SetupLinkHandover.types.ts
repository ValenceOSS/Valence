import type { IssuedSetupLink } from '@ValenceContracts/schemas/SetupLink';

type SetupLinkHandoverProps = {
  link: IssuedSetupLink;
  name: string;
  onEmail?: (() => void) | undefined;
  isEmailing?: boolean;
};

export type { SetupLinkHandoverProps };
