import type { ArrTitle } from '@ValenceServer/arrEmulation/folderOf';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * A request's own words for what it asked for, which is what Radarr or Sonarr would have kept of it.
 *
 * @param request - The request.
 * @returns The title, its year, its overview and its poster.
 */
const titleOfRequest = (request: MediaRequest): ArrTitle => ({
  title: request.title,
  year: request.year,
  overview: request.overview,
  posterUrl: request.posterUrl,
});

export { titleOfRequest };
