import { sendToLinking } from './sendToLinking';
import { TheirLibraryChoiceSchema } from '@ValenceContracts/schemas/LinkSharing';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { TheirLibraryChoice } from '@ValenceContracts/schemas/LinkSharing';

/**
 * Takes one library a linked server shares into this server, or leaves it out.
 *
 * @param id - The linked server.
 * @param libraryId - The library, as that server knows it.
 * @param isTaken - Whether it is to be taken.
 * @returns Whether it is taken now, or why it was refused.
 */
const chooseTheirLibrary = (
  id: string,
  libraryId: string,
  isTaken: boolean,
): Promise<Sent<TheirLibraryChoice | null>> =>
  sendToLinking(
    `/${encodeURIComponent(id)}/their-libraries/${encodeURIComponent(libraryId)}`,
    'PUT',
    TheirLibraryChoiceSchema,
    { isTaken },
  );

export { chooseTheirLibrary };
