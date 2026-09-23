import type { Spot } from '@ValenceTv/components/Flight/Flight.types';
import type { SessionUser } from '@ValenceContracts/schemas/Session';

type SignedInProps = {
  user: SessionUser;
  onChangeServer: () => void;
  isArriving: boolean;
  onFaceAt: (at: Spot) => void;
  onMarkAt: (at: Spot) => void;
};

export type { SignedInProps };
