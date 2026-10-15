import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type WhoIsWatchingProps = {
  profiles: readonly ViewerProfile[];
  onChosen: (profile: ViewerProfile) => void;
};

type ChoosingStep =
  | { kind: 'faces' }
  | { kind: 'pin'; profile: ViewerProfile }
  | { kind: 'newPin'; profile: ViewerProfile; why: string }
  | { kind: 'forgot'; profile: ViewerProfile };

export type { ChoosingStep, WhoIsWatchingProps };
