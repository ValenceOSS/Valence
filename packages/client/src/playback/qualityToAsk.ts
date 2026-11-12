import type { AutoRung } from '@ValenceClient/playback/decideAutoQuality';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';

/**
 * The quality a session is asked for: the step automatic quality is on wherever somebody chose
 * automatic, or pinned the sharpest step the picture reaches, which is the picture as it is; the step
 * they pinned otherwise.
 *
 * @param requested - What somebody chose.
 * @param autoRung - The step automatic quality is on.
 * @param sharpest - The sharpest step the picture reaches, or null where that is not known.
 * @returns The quality to ask for.
 */
const qualityToAsk = (
  requested: QualityPreference,
  autoRung: AutoRung,
  sharpest: string | null,
): QualityPreference =>
  requested === 'auto' || (requested !== 'original' && requested === sharpest)
    ? autoRung
    : requested;

export { qualityToAsk };
