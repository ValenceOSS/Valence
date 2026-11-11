import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { resolveQualityStep } from '@ValenceCore/functions/resolveQualityStep';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';

/**
 * Lists the quality steps worth offering for a particular file.
 *
 * A rung is worth offering when it is within reach of the source and would actually change what
 * gets sent. Those are two questions, and a step at the source's own size can pass both: it changes
 * nothing in resolution but can in bitrate, which is the other half of what a rung is. A 1080p
 * remux at thirty megabits offered at 1080p goes out at four and a half: the same picture on a
 * seventh of the bandwidth, which is the difference between playing and buffering on a poor
 * connection.
 *
 * Within reach means either dimension, not height alone. A rung is a box, and a film shot in scope
 * fills the width of its class while falling well short of the height: a 1920x800 file is 1080p by
 * any reading a viewer would give it, and 1080 is not under 800. Judged on either dimension, it
 * keeps 1080p and still cannot reach for 1440p, which it has neither the width nor the height for.
 *
 * Whether a rung changes anything is asked of [`resolveQualityStep`] rather than worked out again
 * here, so the picker offers exactly what the server will act on. A rung that would be refused as a
 * no-op never appears — a source already inside a rung's ceiling still does not show it.
 *
 * @param media - The file being played.
 * @returns The identifiers of the steps worth offering, largest first.
 */
const listAvailableQualitySteps = (media: MediaItem): QualityStepId[] =>
  QUALITY_STEPS.filter(
    (step) =>
      (step.maxWidth <= media.width || step.maxHeight <= media.height) &&
      resolveQualityStep(media, step.id) !== null,
  ).map((step) => step.id);

export { listAvailableQualitySteps };
