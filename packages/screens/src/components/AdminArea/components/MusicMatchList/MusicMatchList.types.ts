import type { MusicCatalogueHit } from '@ValenceContracts/schemas/MediaRequest';

type MusicMatchListProps = {
  matches: MusicCatalogueHit[];
  onChoose: (match: MusicCatalogueHit) => void;
};

export type { MusicMatchListProps };
