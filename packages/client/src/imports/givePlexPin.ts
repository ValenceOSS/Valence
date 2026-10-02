import { MediaImportDoneSchema } from '@ValenceContracts/schemas/MediaImport';
import type { PlexPin } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Gives a Plex Home member's PIN so their watching can be read; the server does not keep it.
 *
 * @param sourceId - The source.
 * @param pin - Whose PIN, and the PIN.
 * @returns The answer, or why it was refused.
 */
const givePlexPin = (sourceId: string, pin: PlexPin): Promise<Answer<{ done: boolean }>> =>
  sendToServer(
    `/api/admin/imports/${encodeURIComponent(sourceId)}/pins`,
    { method: 'POST', body: pin },
    MediaImportDoneSchema,
  );

export { givePlexPin };
