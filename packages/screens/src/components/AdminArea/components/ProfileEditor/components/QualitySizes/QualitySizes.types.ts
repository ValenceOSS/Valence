import type { QualitySize, VideoQualityId } from '@ValenceContracts/schemas/QualityProfile';

type QualitySizesProps = {
  qualities: readonly VideoQualityId[];
  sizes: readonly QualitySize[];
  onChange: (sizes: QualitySize[]) => void;
};

export type { QualitySizesProps };
