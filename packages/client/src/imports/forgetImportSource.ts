import { MediaImportDoneSchema } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Forgets a server connected to import from; what was already imported stays.
 *
 * @param sourceId - The source.
 * @returns The answer, or why it was refused.
 */
const forgetImportSource = (sourceId: string): Promise<Answer<{ done: boolean }>> =>
  sendToServer(
    `/api/admin/imports/${encodeURIComponent(sourceId)}`,
    { method: 'DELETE' },
    MediaImportDoneSchema,
  );

export { forgetImportSource };
