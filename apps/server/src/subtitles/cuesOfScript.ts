import { parseAdvancedSubStation } from '@ValenceCore/functions/parseAdvancedSubStation';
import type { AssCue } from '@ValenceCore/functions/parseAdvancedSubStation';

/**
 * The styled lines of an Advanced SubStation script, or nothing where there was no script or it
 * held no line that could be read, so that a player falls back to the track's WebVTT rather than
 * showing nothing.
 *
 * @param script - The script, or nothing.
 * @returns Its lines, or nothing.
 */
const cuesOfScript = (script: string | null): AssCue[] | null => {
  const cues = script === null ? [] : parseAdvancedSubStation(script).cues;

  return cues.length === 0 ? null : cues;
};

export { cuesOfScript };
