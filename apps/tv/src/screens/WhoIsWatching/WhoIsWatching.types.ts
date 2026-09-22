import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type WhoIsWatchingProps = {
  onChoose: (profile: ViewerProfile) => void;
  onUsePhone: () => void;
  onChangeServer: () => void;
};

export type { WhoIsWatchingProps };
