import { ArrImportAppliedSchema } from '@ValenceContracts/schemas/ArrImport';
import type { ArrImportApplied, ArrImportAsk } from '@ValenceContracts/schemas/ArrImport';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import type { Sent } from '@ValenceClient/requests/sendToRequests';

/**
 * Brings a Radarr, Sonarr, Lidarr, Prowlarr and Overseerr or Jellyseerr setup in, changing only
 * Valence; running it again adds nothing twice.
 *
 * @param ask - The apps, where their folders are, masked secrets typed in again, and how each
 * library is to be fulfilled.
 * @returns What was done and what was being waited for, or why not.
 */
const applyArrImport = (ask: ArrImportAsk): Promise<Sent<ArrImportApplied>> =>
  sendToRequests('/api/admin/imports/arr/apply', 'POST', ask, async (response) =>
    ArrImportAppliedSchema.parse(await response.json()),
  );

export { applyArrImport };
