import { MediaImportRunSchema } from '@ValenceContracts/schemas/MediaImport';
import type { MediaImportRun } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Reads how an import is getting on, and its report.
 *
 * @param runId - The import.
 * @returns The answer, or why it was refused.
 */
const fetchImportRun = (runId: string): Promise<Answer<MediaImportRun>> =>
  sendToServer(
    `/api/admin/imports/runs/${encodeURIComponent(runId)}`,
    { method: 'GET' },
    MediaImportRunSchema,
  );

export { fetchImportRun };
