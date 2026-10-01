import { readFromServer } from '@ValenceClient/query/readFromServer';
import { SeerrLinkSchema } from '@ValenceContracts/schemas/SeerrLink';
import type { SeerrLink } from '@ValenceContracts/schemas/SeerrLink';

/**
 * Reads how Overseerr or Jellyseerr reaches Valence as Radarr and Sonarr: whether it is on, the
 * key, who its requests are made as and where it answers.
 *
 * @returns The link.
 */
const fetchSeerrLink = (): Promise<SeerrLink> =>
  readFromServer('/api/requests/seerr', SeerrLinkSchema);

export { fetchSeerrLink };
