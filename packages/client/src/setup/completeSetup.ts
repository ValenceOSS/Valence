import { SetupResultSchema } from '@ValenceContracts/schemas/Setup';
import type { SetupRequest, SetupResult } from '@ValenceContracts/schemas/Setup';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Makes the administrator and stores how the server is reached, which signs the administrator in.
 *
 * @param request - The administrator, the trusted origins and whether cookies are secure.
 * @returns What the server did, or why it refused.
 */
const completeSetup = (request: SetupRequest): Promise<Answer<SetupResult>> =>
  sendToServer('/api/setup', { method: 'POST', body: request }, SetupResultSchema);

export { completeSetup };
