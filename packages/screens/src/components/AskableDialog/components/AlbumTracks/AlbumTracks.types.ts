import type { CatalogueTrack } from '@ValenceContracts/schemas/CatalogueTitle';

type AlbumTracksProps = {
  tracks: readonly CatalogueTrack[];
  label: string | null;
};

export type { AlbumTracksProps };
