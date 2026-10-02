import { MediaImportRunSchema } from '@ValenceContracts/schemas/MediaImport';
import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Stops a dry run or an import that is under way.
 *
 * @param runId - The import.
 * @returns The answer, or why it was refused.
 */
const cancelMediaImport = (runId: string): Promise<Answer<MediaImportRun>> =>
  sendToServer(
    `/api/admin/imports/runs/${encodeURIComponent(runId)}/cancel`,
    { method: 'POST' },
    MediaImportRunSchema,
  );

export { cancelMediaImport };
