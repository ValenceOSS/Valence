import type { SessionUser } from '@ValenceContracts/schemas/Session';

type SignedInProps = {
  user: SessionUser;
  onChangeServer: () => void;
};

export type { SignedInProps };
