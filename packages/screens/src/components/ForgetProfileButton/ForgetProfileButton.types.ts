import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type ForgetProfileButtonProps = {
  profile: ViewerProfile;
  onForgotten: () => void;
};

export type { ForgetProfileButtonProps };
