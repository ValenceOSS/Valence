import type { MusicMixSummary } from '@ValenceContracts/schemas/MusicMix';

type MixShelfProps = {
  heading: string;
  mixes: readonly MusicMixSummary[];
};

export type { MixShelfProps };
