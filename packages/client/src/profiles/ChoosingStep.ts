import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type ChoosingStep =
  | { kind: 'faces' }
  | { kind: 'pin'; profile: ViewerProfile }
  | { kind: 'newPin'; profile: ViewerProfile; why: string }
  | { kind: 'forgot'; profile: ViewerProfile };

export type { ChoosingStep };
