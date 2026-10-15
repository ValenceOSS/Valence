import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type WhoIsWatchingProps = {
  profiles: readonly ViewerProfile[];
  onChosen: (profile: ViewerProfile) => void;
};

export type { WhoIsWatchingProps };
