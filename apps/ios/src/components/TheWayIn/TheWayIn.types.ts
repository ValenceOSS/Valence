import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type TheWayInProps = {
  onPicked: (profile: ViewerProfile) => void;
  onIn: () => void;
  onElsewhere: () => void;
  onDownloads: () => void;
};

export type { TheWayInProps };
