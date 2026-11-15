import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type FaceProps = {
  profile: Pick<ViewerProfile, 'id' | 'name' | 'colour' | 'avatar' | 'updatedAt'>;
  size: number;
  isFocused?: boolean;
  isRound?: boolean;
};

export type { FaceProps };
