import type { MusicMixSummary } from '@ValenceContracts/schemas/MusicMix';

type MixArtworkProps = {
  mix: Pick<MusicMixSummary, 'id' | 'kind' | 'title' | 'faces' | 'coverAlbumIds'>;
  number?: number;
};

export type { MixArtworkProps };
