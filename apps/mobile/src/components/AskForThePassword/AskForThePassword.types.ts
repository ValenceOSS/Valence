import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';

type AskForThePasswordProps = {
  profile: ViewerProfile;
  from?: ARectOnScreen | null;
  onIn: (at: ARectOnScreen | null) => void;
  isGoing?: boolean;
  isLeaving?: boolean;
  onBack: (at: ARectOnScreen | null) => void;
};

export type { AskForThePasswordProps };
