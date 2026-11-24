import { QUALITY_STEP_IDS } from '@ValenceContracts/schemas/QualityStep';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';

/**
 * Whether a quality is above a ceiling, so out of reach of somebody held to it.
 *
 * @param step - The quality.
 * @param ceiling - The highest quality allowed, or null where none is set.
 * @returns Whether it is above the ceiling.
 */
const isAboveQuality = (step: QualityStepId, ceiling: QualityStepId | null): boolean =>
  ceiling !== null && QUALITY_STEP_IDS.indexOf(step) < QUALITY_STEP_IDS.indexOf(ceiling);

export { isAboveQuality };
