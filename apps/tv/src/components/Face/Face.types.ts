import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type FaceProps = {
  profile: ViewerProfile;
  size: number;
  isFocused?: boolean;
  isRound?: boolean;
};

export type { FaceProps };
