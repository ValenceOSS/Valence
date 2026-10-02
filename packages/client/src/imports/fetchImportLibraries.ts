import { MediaImportLibrariesSchema } from '@ValenceContracts/schemas/MediaImport';
import type { MediaImportLibraries } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Reads a source's libraries and where each of their folders is as Valence sees it.
 *
 * @param sourceId - The source.
 * @returns The answer, or why it was refused.
 */
const fetchImportLibraries = (sourceId: string): Promise<Answer<MediaImportLibraries>> =>
  sendToServer(
    `/api/admin/imports/${encodeURIComponent(sourceId)}/libraries`,
    { method: 'GET' },
    MediaImportLibrariesSchema,
  );

export { fetchImportLibraries };
