import { readFromServer } from '@ValenceClient/query/readFromServer';
import { SetupLinkDetailsSchema } from '@ValenceContracts/schemas/SetupLink';
import type { SetupLinkDetails } from '@ValenceContracts/schemas/SetupLink';

/**
 * Reads what a setup link's owner still has to choose. Throws, with the status, for a link that no
 * longer works.
 *
 * @param token - The token from the link.
 * @returns The account it sets up.
 */
const readSetupLink = (token: string): Promise<SetupLinkDetails> =>
  readFromServer(`/api/setup-links/${encodeURIComponent(token)}`, SetupLinkDetailsSchema);

export { readSetupLink };
