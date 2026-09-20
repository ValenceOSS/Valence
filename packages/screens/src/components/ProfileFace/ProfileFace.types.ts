import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type ProfileFaceProps = {
  profile: ViewerProfile;
  pending?: File | null;
  shape?: 'circle' | 'tile';
  isLifted?: boolean;
  className?: string;
};

export type { ProfileFaceProps };
