import { readFromServer } from '@ValenceClient/query/readFromServer';
import { PreRollSetupSchema } from '@ValenceContracts/schemas/PreRoll';
import type { PreRollSetup } from '@ValenceContracts/schemas/PreRoll';

/**
 * Reads whether a clip plays before films and episodes, where the clips are kept, and which clips
 * that folder holds.
 *
 * @returns The setup.
 */
const fetchPreRollSetup = (): Promise<PreRollSetup> =>
  readFromServer('/api/admin/pre-roll', PreRollSetupSchema);

export { fetchPreRollSetup };
