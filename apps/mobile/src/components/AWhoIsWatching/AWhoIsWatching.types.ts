import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type AWhoIsWatchingProps = {
  profiles: readonly ViewerProfile[];
  onChosen: () => void;
};

export type { AWhoIsWatchingProps };
