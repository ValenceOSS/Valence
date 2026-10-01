import { PreTranscodingStatusSchema } from '@ValenceContracts/schemas/PreTranscoding';
import type {
  PreTranscodingSettings,
  PreTranscodingStatus,
} from '@ValenceContracts/schemas/PreTranscoding';

/**
 * Changes the pre-transcoding settings.
 *
 * @param settings - The settings, whole.
 * @returns The settings as saved and how far it has got, or nothing where the server would not
 *   take them.
 */
const savePreTranscoding = async (
  settings: PreTranscodingSettings,
): Promise<PreTranscodingStatus | null> => {
  const response = await fetch('/api/pre-transcoding', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(settings),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  return PreTranscodingStatusSchema.parse(await response.json());
};

export { savePreTranscoding };
