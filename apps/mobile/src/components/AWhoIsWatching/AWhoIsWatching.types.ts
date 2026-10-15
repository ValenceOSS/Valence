import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ARectOnScreen } from '@ValenceMobile/hooks/useArrivingFrom.types';

type AWhoIsWatchingProps = {
  profiles: readonly ViewerProfile[];
  onChosen: () => void;
  onSignOut: () => void;
  onFaceAt?: (at: ARectOnScreen, isATile: boolean) => void;
  isFaceArriving?: boolean;
};

export type { AWhoIsWatchingProps };
