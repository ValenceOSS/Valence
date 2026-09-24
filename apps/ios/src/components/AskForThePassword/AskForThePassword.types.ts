import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ARectOnScreen } from '@ValencePhone/hooks/useArrivingFrom.types';

type AskForThePasswordProps = {
  profile: ViewerProfile;
  from?: ARectOnScreen | null;
  onIn: (at: ARectOnScreen | null) => void;
  isGoing?: boolean;
  onBack: (at: ARectOnScreen | null) => void;
};

export type { AskForThePasswordProps };
