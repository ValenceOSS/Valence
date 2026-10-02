import { MediaImportSourceSchema } from '@ValenceContracts/schemas/MediaImport';
import type { ConnectMediaImport, MediaImportSource } from '@ValenceContracts/schemas/MediaImport';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Connects a Jellyfin, Emby or Plex server to import from, which the server checks by reading it.
 *
 * @param asked - What to send.
 * @returns The answer, or why it was refused.
 */
const connectImportSource = (asked: ConnectMediaImport): Promise<Answer<MediaImportSource>> =>
  sendToServer('/api/admin/imports', { method: 'POST', body: asked }, MediaImportSourceSchema);

export { connectImportSource };
