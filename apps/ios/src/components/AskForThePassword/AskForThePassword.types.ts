import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type AskForThePasswordProps = {
  profile: ViewerProfile;
  onIn: () => void;
  onBack: () => void;
};

export type { AskForThePasswordProps };
