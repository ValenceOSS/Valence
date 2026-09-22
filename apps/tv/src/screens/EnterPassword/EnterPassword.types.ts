import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type EnterPasswordProps = {
  profile: ViewerProfile;
  onSignedIn: () => void;
  onBack: () => void;
};

export type { EnterPasswordProps };
