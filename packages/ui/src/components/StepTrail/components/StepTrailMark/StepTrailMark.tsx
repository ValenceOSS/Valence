import { StatusRing } from '@ValenceUI/StatusRing';
import type { StatusRingStatus } from '@ValenceUI/StatusRing.types';
import type { StepTrailMarkKind } from '@ValenceUI/StepTrail.types';
import type { StepTrailMarkProps } from './StepTrailMark.types';

const STATUSES: Readonly<Record<StepTrailMarkKind, StatusRingStatus>> = {
  done: 'done',
  current: 'running',
  failed: 'failed',
  waiting: 'pending',
  locked: 'pending',
};

/**
 * The round status mark at the head of one step of a trail: done, failed, turning for the step under
 * way, and waiting for one still to come or one that waits on somebody.
 *
 * @param kind - Which of those it is.
 */
const StepTrailMark = ({ kind }: StepTrailMarkProps) => (
  <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full">
    <StatusRing status={STATUSES[kind]} size={20} />
  </span>
);

StepTrailMark.displayName = 'StepTrailMark';

export { StepTrailMark };
