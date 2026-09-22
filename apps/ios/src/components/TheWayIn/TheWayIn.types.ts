import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type TheWayInProps = {
  onPicked: (profile: ViewerProfile) => void;
  onElsewhere: () => void;
};

export type { TheWayInProps };
