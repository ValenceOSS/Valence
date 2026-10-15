import type { ReactNode } from 'react';
import type { ProfileColour, ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type ProfileRosterProps = {
  profiles: readonly ViewerProfile[];
  menuFor?: (profile: ViewerProfile) => ReactNode;
  onAdd: (name: string, colour: ProfileColour) => Promise<boolean>;
};

export type { ProfileRosterProps };
