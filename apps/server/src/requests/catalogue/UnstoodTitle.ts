import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type UnstoodTitle = Omit<CatalogueTitle, 'standing'>;

export type { UnstoodTitle };
