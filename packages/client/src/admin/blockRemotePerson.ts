import { sendToLinking } from './sendToLinking';
import { RemotePersonSchema } from '@ValenceContracts/schemas/LinkSharing';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { RemotePerson } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Blocks one person from a linked server, or lets them back in.
 *
 * @param id - The linked server.
 * @param personId - The person.
 * @param isBlocked - Whether they are to be blocked.
 * @returns The person as they now stand, or why it was refused.
 */
const blockRemotePerson = (
  id: string,
  personId: string,
  isBlocked: boolean,
): Promise<Sent<RemotePerson | null>> =>
  sendToLinking(
    `/${encodeURIComponent(id)}/people/${encodeURIComponent(personId)}/block`,
    isBlocked ? 'PUT' : 'DELETE',
    RemotePersonSchema,
  );

export { blockRemotePerson };
