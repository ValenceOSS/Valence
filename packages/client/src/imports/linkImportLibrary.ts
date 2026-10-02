import { MediaImportLibrariesSchema } from '@ValenceContracts/schemas/MediaImport';
import type {
  LinkImportLibrary,
  MediaImportLibraries,
} from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Brings one of a source's folders into a library Valence already has, instead of making a new one.
 *
 * @param sourceId - The source.
 * @param link - The source's library and folder, and the Valence library it goes into.
 * @returns The libraries as they are now placed, or why it was refused.
 */
const linkImportLibrary = (
  sourceId: string,
  link: LinkImportLibrary,
): Promise<Answer<MediaImportLibraries>> =>
  sendToServer(
    `/api/admin/imports/${encodeURIComponent(sourceId)}/library-links`,
    { method: 'PUT', body: link },
    MediaImportLibrariesSchema,
  );

export { linkImportLibrary };
