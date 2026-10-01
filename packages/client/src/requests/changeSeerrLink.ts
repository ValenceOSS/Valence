import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import { SeerrLinkSchema } from '@ValenceContracts/schemas/SeerrLink';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { SeerrLink, SeerrLinkChange } from '@ValenceContracts/schemas/SeerrLink';

/**
 * Turns Valence answering Overseerr or Jellyseerr on or off, and chooses whose name its requests
 * are made in.
 *
 * @param change - Whether it is on, and the account.
 * @returns The link as saved, or why not.
 */
const changeSeerrLink = (change: SeerrLinkChange): Promise<Sent<SeerrLink>> =>
  sendToRequests('/api/requests/seerr', 'PUT', change, async (response) =>
    SeerrLinkSchema.parse(await response.json()),
  );

export { changeSeerrLink };
