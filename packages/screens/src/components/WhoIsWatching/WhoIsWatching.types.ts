import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type WhoIsWatchingProps = {
  name: string;
  account?: string;
  profiles: readonly ViewerProfile[];
  askingFor?: string | null;
  onChosen: (profile: ViewerProfile) => void;
  onSignOut: () => void;
};

export type { WhoIsWatchingProps };
