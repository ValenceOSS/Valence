import { readFromServer } from '@ValenceClient/query/readFromServer';
import { EmailSetupSchema } from '@ValenceContracts/schemas/EmailSetup';
import type { EmailSetup } from '@ValenceContracts/schemas/EmailSetup';

/**
 * Reads how Valence sends email, and the emails it has tried lately.
 *
 * @returns The mail server and sender, whether a password is set, and the latest sends.
 */
const fetchEmailSetup = async (): Promise<EmailSetup> =>
  readFromServer('/api/admin/email', EmailSetupSchema);

export { fetchEmailSetup };
