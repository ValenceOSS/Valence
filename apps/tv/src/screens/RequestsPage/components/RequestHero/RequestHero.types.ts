import type { ReactNode } from 'react';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestHeroProps = {
  request: MediaRequest | null;
  going: RequestProgress | null;
  isSomeoneElses: boolean;
  film: string | null;
  picture: string | null;
  logoPath: string | null;
  children?: ReactNode;
};

export type { RequestHeroProps };
