import type { StepTrailLine } from '@ValenceUI/StepTrail.types';

type StepTrailLinesProps = {
  lines: readonly StepTrailLine[];
  hasNext: boolean;
  isSettled: boolean;
};

export type { StepTrailLinesProps };
