import { ArrWantedOutcomeSchema } from '@ValenceContracts/schemas/ArrImport';
import type { ArrWanted, ArrWantedOutcome } from '@ValenceContracts/schemas/ArrImport';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import type { Sent } from '@ValenceClient/requests/sendToRequests';

/**
 * Asks for some of what a brought-in setup was waiting for, as whoever asked for each there.
 *
 * @param items - Up to 25 of them.
 * @returns How many were asked for and what could not be, or why not.
 */
const askForArrWanted = (items: readonly ArrWanted[]): Promise<Sent<ArrWantedOutcome>> =>
  sendToRequests('/api/admin/imports/arr/requests', 'POST', { items }, async (response) =>
    ArrWantedOutcomeSchema.parse(await response.json()),
  );

export { askForArrWanted };
