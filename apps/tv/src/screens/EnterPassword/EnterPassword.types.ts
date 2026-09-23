import type { Leaving, Spot } from '@ValenceTv/components/Flight/Flight.types';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type EnterPasswordProps = {
  profile: ViewerProfile;
  onSignedIn: (from: Leaving) => void;
  isArriving: boolean;
  onFaceAt: (at: Spot) => void;
  onMarkAt: (at: Spot) => void;
  onBack: () => void;
};

export type { EnterPasswordProps };
