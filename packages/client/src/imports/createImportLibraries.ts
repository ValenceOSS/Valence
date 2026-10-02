import { CreatedImportLibrariesSchema } from '@ValenceContracts/schemas/MediaImport';
import type {
  CreateImportLibraries,
  CreatedImportLibrary,
} from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Makes Valence libraries for a source's folders and starts scanning them.
 *
 * @param sourceId - The source.
 * @param asked - What to send.
 * @returns The answer, or why it was refused.
 */
const createImportLibraries = (
  sourceId: string,
  asked: CreateImportLibraries,
): Promise<Answer<{ libraries: CreatedImportLibrary[] }>> =>
  sendToServer(
    `/api/admin/imports/${encodeURIComponent(sourceId)}/libraries`,
    { method: 'POST', body: asked },
    CreatedImportLibrariesSchema,
  );

export { createImportLibraries };
