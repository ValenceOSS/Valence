import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type CatalogueProps = {
  kind: 'films' | 'shows';
  watchable: readonly string[];
  onOpen: (media: MediaSummary) => void;
};

export type { CatalogueProps };
