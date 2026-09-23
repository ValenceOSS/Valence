import type { Leaving } from '@ValenceTv/components/Flight/Flight.types';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type WhoIsWatchingProps = {
  onChoose: (profile: ViewerProfile, from: Leaving) => void;
  onSignedIn: () => void;
  onChangeServer: () => void;
};

export type { WhoIsWatchingProps };
