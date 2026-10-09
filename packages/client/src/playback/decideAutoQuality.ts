import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';

const STALLS_BEFORE_STEPPING_DOWN = 2;

const STEADY_SECONDS_BEFORE_STEPPING_UP = 120;

const SHARE_OF_THE_CONNECTION_TO_USE = 0.7;

const HEADROOM_BEFORE_STEPPING_UP = 1.5;

type AutoRung = QualityStepId | 'original';

type AutoQualityReading = {
  current: AutoRung;
  steps: readonly QualityStepId[];
  sourceBitrateKbps: number | null;
  estimatedKbps: number | null;
  stallsLately: number;
  steadySeconds: number;
};

/**
 * What a rung costs a second, the original being whatever the file runs at.
 *
 * @param rung - The rung.
 * @param sourceBitrateKbps - What the file runs at, where it is known.
 * @returns The kilobits a second, infinite for an original nobody measured.
 */
const costOf = (rung: AutoRung, sourceBitrateKbps: number | null): number =>
  rung === 'original'
    ? (sourceBitrateKbps ?? Number.POSITIVE_INFINITY)
    : (QUALITY_STEPS.find((step) => step.id === rung)?.maxVideoBitrateKbps ??
      Number.POSITIVE_INFINITY);

/**
 * Decides whether a stream left on auto should move to another rung, from how the connection has
 * been keeping up. Steps down after repeated stalls, to the highest rung the measured connection
 * carries with room to spare, or one rung where it has not been measured. Steps back up one rung at a
 * time, only after a long stretch without stalls and with plenty of room, because each move restarts
 * the stream and a viewer notices that more than a softer picture.
 *
 * @param reading - The rung playing now, the rungs on offer largest first, what the file and the
 *   connection run at, and how playback has gone lately.
 * @returns The rung to move to, or null to stay.
 */
const decideAutoQuality = ({
  current,
  steps,
  sourceBitrateKbps,
  estimatedKbps,
  stallsLately,
  steadySeconds,
}: AutoQualityReading): AutoRung | null => {
  const ladder: AutoRung[] = ['original', ...steps];
  const at = ladder.indexOf(current);

  if (at === -1) {
    return null;
  }

  if (stallsLately >= STALLS_BEFORE_STEPPING_DOWN) {
    const lower = ladder.slice(at + 1);

    if (lower.length === 0) {
      return null;
    }

    if (estimatedKbps === null) {
      return lower[0] ?? null;
    }

    const affordable = estimatedKbps * SHARE_OF_THE_CONNECTION_TO_USE;

    return lower.find((rung) => costOf(rung, sourceBitrateKbps) <= affordable) ?? lower[0] ?? null;
  }

  if (stallsLately > 0 || steadySeconds < STEADY_SECONDS_BEFORE_STEPPING_UP || at === 0) {
    return null;
  }

  const higher = ladder[at - 1];

  if (higher === undefined || estimatedKbps === null) {
    return null;
  }

  return costOf(higher, sourceBitrateKbps) * HEADROOM_BEFORE_STEPPING_UP <= estimatedKbps
    ? higher
    : null;
};

export type { AutoQualityReading, AutoRung };

export { decideAutoQuality };
