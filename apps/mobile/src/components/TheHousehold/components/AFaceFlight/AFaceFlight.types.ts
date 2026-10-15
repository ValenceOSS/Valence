import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';

type AFaceFlightProps = {
  profile: ViewerProfile;
  from: ARectOnScreen;
  to: ARectOnScreen | null;
  isOntoATile: boolean;
  onLanded: () => void;
};

export type { AFaceFlightProps };
