import type { ResourceSampleRange } from '@ValenceContracts/schemas/ResourceSample';

type LoadRange = 'minute' | ResourceSampleRange;

type LoadRangeToggleProps = {
  value: LoadRange;
  onChange: (value: LoadRange) => void;
};

export type { LoadRange, LoadRangeToggleProps };
