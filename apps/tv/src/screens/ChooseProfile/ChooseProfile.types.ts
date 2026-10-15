import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type ChooseProfileProps = {
  profiles: readonly ViewerProfile[];
  onChosen: () => void;
};

export type { ChooseProfileProps };
