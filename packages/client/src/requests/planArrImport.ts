import { ArrImportPlanSchema } from '@ValenceContracts/schemas/ArrImport';
import type { ArrImportAsk, ArrImportPlan } from '@ValenceContracts/schemas/ArrImport';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import type { Sent } from '@ValenceClient/requests/sendToRequests';

/**
 * Asks what bringing a Radarr, Sonarr, Lidarr, Prowlarr and Overseerr or Jellyseerr setup in would
 * do, which reads from them and changes nothing.
 *
 * @param ask - The apps, where their folders are, masked secrets typed in again.
 * @returns The plan, or why not.
 */
const planArrImport = (ask: ArrImportAsk): Promise<Sent<ArrImportPlan>> =>
  sendToRequests('/api/admin/imports/arr/plan', 'POST', ask, async (response) =>
    ArrImportPlanSchema.parse(await response.json()),
  );

export { planArrImport };
