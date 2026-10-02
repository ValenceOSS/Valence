import { MediaImportLibrariesSchema } from '@ValenceContracts/schemas/MediaImport';
import type { MediaImportLibraries, PathMapping } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Says where a source's folders are as Valence sees them.
 *
 * @param sourceId - The source.
 * @param mappings - Each folder on the source, and where it is in Valence.
 * @returns The answer, or why it was refused.
 */
const saveImportMappings = (
  sourceId: string,
  mappings: readonly PathMapping[],
): Promise<Answer<MediaImportLibraries>> =>
  sendToServer(
    `/api/admin/imports/${encodeURIComponent(sourceId)}/mappings`,
    { method: 'PUT', body: { mappings } },
    MediaImportLibrariesSchema,
  );

export { saveImportMappings };
