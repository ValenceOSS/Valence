import { MediaImportRunSchema } from '@ValenceContracts/schemas/MediaImport';
import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Carries out a planned import, or runs it again.
 *
 * @param runId - The import.
 * @returns The answer, or why it was refused.
 */
const startMediaImport = (runId: string): Promise<Answer<MediaImportRun>> =>
  sendToServer(
    `/api/admin/imports/runs/${encodeURIComponent(runId)}/start`,
    { method: 'POST' },
    MediaImportRunSchema,
  );

export { startMediaImport };
