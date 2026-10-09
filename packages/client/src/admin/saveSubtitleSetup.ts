import { SubtitleSetupSchema } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleSetup, SubtitleSetupChange } from '@ValenceContracts/schemas/SubtitleFinding';

/**
 * Changes where Valence finds subtitles; an empty key or password keeps the one saved.
 *
 * @param change - The settings, whole.
 * @returns The settings as saved, or nothing where the server would not take them.
 */
const saveSubtitleSetup = async (change: SubtitleSetupChange): Promise<SubtitleSetup | null> => {
  const response = await fetch('/api/admin/subtitles', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(change),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  return SubtitleSetupSchema.parse(await response.json());
};

export { saveSubtitleSetup };
