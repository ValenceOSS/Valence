import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { Spot } from '@ValenceTv/components/Flight/Flight.types';

type ChooseProfileProps = {
  profiles: readonly ViewerProfile[];
  onChosen: () => void;
  onSignOut: () => void;
  isArriving: boolean;
  onFaceAt: (at: Spot) => void;
  onMarkAt: (at: Spot) => void;
};

export type { ChooseProfileProps };
