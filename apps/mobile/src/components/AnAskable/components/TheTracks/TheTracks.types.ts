import type { CatalogueTrack } from '@ValenceContracts/schemas/CatalogueTitle';

type TheTracksProps = {
  tracks: readonly CatalogueTrack[];
  label: string | null;
};

export type { TheTracksProps };
