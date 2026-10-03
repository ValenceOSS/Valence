import { QUALITY_STEP_IDS } from '@ValenceContracts/schemas/QualityStep';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';

/**
 * The quality to play at under a ceiling: what was asked for where it is within it, the ceiling
 * where it is above it or where nothing was asked for.
 *
 * @param asked - The quality asked for, if any.
 * @param ceiling - The highest quality allowed.
 * @returns The quality to play at.
 */
const ceilingOf = (asked: QualityStepId | undefined, ceiling: QualityStepId): QualityStepId =>
  asked !== undefined && QUALITY_STEP_IDS.indexOf(asked) >= QUALITY_STEP_IDS.indexOf(ceiling)
    ? asked
    : ceiling;

export { ceilingOf };
