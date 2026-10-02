import { MediaImportRunSchema } from '@ValenceContracts/schemas/MediaImport';
import type { MediaImportRun, PlanMediaImport } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Starts the dry run of an import, which reads everything and writes nothing.
 *
 * @param sourceId - The source.
 * @param asked - What to send.
 * @returns The answer, or why it was refused.
 */
const planMediaImport = (
  sourceId: string,
  asked: PlanMediaImport,
): Promise<Answer<MediaImportRun>> =>
  sendToServer(
    `/api/admin/imports/${encodeURIComponent(sourceId)}/plan`,
    { method: 'POST', body: asked },
    MediaImportRunSchema,
  );

export { planMediaImport };
