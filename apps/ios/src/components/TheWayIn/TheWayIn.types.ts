import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ARectOnScreen } from '@ValencePhone/hooks/useArrivingFrom.types';

type TheWayInProps = {
  returningFrom?: { profileId: string; at: ARectOnScreen } | null;
  onPicked: (profile: ViewerProfile, at: ARectOnScreen | null) => void;
  onIn: () => void;
  onElsewhere: () => void;
  onDownloads: () => void;
};

export type { TheWayInProps };
