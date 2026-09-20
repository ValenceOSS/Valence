import { readFromServer } from '@ValenceClient/query/readFromServer';
import { AppearanceSchema } from '@ValenceContracts/schemas/Roundness';
import type { Appearance } from '@ValenceContracts/schemas/Roundness';

/**
 * Asks how this Valence should look, which is the same for everybody and is asked for before anybody
 * has signed in.
 *
 * @returns What the server says.
 */
const fetchAppearance = (): Promise<Appearance> =>
  readFromServer('/api/appearance', AppearanceSchema);

export { fetchAppearance };
