import { MediaImportStatusSchema } from '@ValenceContracts/schemas/MediaImport';
import type { MediaImportStatus } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Reads the servers connected to import from, the latest import from each, and whether requesting can be brought across too.
 *
 * @returns The answer, or why it was refused.
 */
const fetchImportStatus = (): Promise<Answer<MediaImportStatus>> =>
  sendToServer('/api/admin/imports', { method: 'GET' }, MediaImportStatusSchema);

export { fetchImportStatus };
