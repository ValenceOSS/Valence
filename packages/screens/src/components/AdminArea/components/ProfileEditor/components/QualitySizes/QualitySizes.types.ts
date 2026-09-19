import type { ReleaseSource, Resolution } from '@ValenceContracts/schemas/ParsedRelease';
import type { QualitySize } from '@ValenceContracts/schemas/QualityProfile';

type QualitySizesProps = {
  resolutions: readonly Resolution[];
  sources: readonly ReleaseSource[];
  sizes: readonly QualitySize[];
  onChange: (sizes: QualitySize[]) => void;
};

export type { QualitySizesProps };
