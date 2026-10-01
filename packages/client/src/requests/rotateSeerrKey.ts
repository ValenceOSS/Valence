import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import { SeerrLinkSchema } from '@ValenceContracts/schemas/SeerrLink';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { SeerrLink } from '@ValenceContracts/schemas/SeerrLink';

/**
 * Makes a new key for Overseerr or Jellyseerr, so the old one stops working.
 *
 * @returns The link with its new key, or why not.
 */
const rotateSeerrKey = (): Promise<Sent<SeerrLink>> =>
  sendToRequests('/api/requests/seerr/key', 'POST', undefined, async (response) =>
    SeerrLinkSchema.parse(await response.json()),
  );

export { rotateSeerrKey };
