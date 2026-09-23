import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ARectOnScreen } from '@ValencePhone/hooks/useArrivingFrom.types';

type AWallFaceProps = {
  profile: ViewerProfile;
  arrivingFrom: ARectOnScreen | null;
  onPicked: (profile: ViewerProfile, at: ARectOnScreen | null) => void;
};

export type { AWallFaceProps };
