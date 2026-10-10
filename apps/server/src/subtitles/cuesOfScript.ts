import { parseAdvancedSubStation } from '@ValenceCore/functions/parseAdvancedSubStation';
import type { AssCue } from '@ValenceCore/functions/parseAdvancedSubStation';

/**
 * The styled lines of an Advanced SubStation script, or nothing where there was no script.
 *
 * @param script - The script, or nothing.
 * @returns Its lines, or nothing.
 */
const cuesOfScript = (script: string | null): AssCue[] | null =>
  script === null ? null : parseAdvancedSubStation(script).cues;

export { cuesOfScript };
