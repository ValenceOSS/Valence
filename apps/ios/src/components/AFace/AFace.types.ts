import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type AFaceProps = {
  profile: Pick<ViewerProfile, 'id' | 'updatedAt' | 'avatar' | 'name' | 'colour'>;
  picked?: string | null;
  isLarge?: boolean;
};

export type { AFaceProps };
