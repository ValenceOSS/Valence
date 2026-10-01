import { folderOf } from '@ValenceServer/arrEmulation/folderOf';
import { imagesOf } from '@ValenceServer/arrEmulation/imagesOf';
import { NEVER_ADDED } from '@ValenceServer/arrEmulation/NEVER_ADDED';
import { isOnDisk } from '@ValenceServer/arrEmulation/isOnDisk';
import type { ArrImage } from '@ValenceServer/arrEmulation/imagesOf';
import type { ArrTitle } from '@ValenceServer/arrEmulation/folderOf';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RadarrMovieFacts = {
  tmdbId: number;
  title: ArrTitle;
  request: MediaRequest | null;
  isHeld: boolean;
  qualityProfileId: number;
  rootFolderPath: string;
};

type RadarrMovie = {
  id?: number;
  title: string;
  sortTitle: string;
  tmdbId: number;
  year: number;
  overview: string;
  titleSlug: string;
  images: ArrImage[];
  monitored: boolean;
  hasFile: boolean;
  isAvailable: boolean;
  status: 'released';
  minimumAvailability: 'released';
  qualityProfileId: number;
  rootFolderPath: string;
  folderName: string;
  path: string;
  tags: number[];
  added: string;
  sizeOnDisk: number;
  runtime: number;
  genres: string[];
};

/**
 * A film as Radarr describes one, for Overseerr or Jellyseerr to read: known to Radarr — with an id
 * — once it has been asked for or is in the library, watched once asking for it was approved, and
 * with its file once it is in the library.
 *
 * @param facts - The film, its request where there is one, and whether the library has it.
 * @returns The film, in Radarr's words.
 */
const radarrMovieOf = (facts: RadarrMovieFacts): RadarrMovie => {
  const { tmdbId, title, request, isHeld, qualityProfileId, rootFolderPath } = facts;
  const folderName = folderOf(title);

  return {
    ...(request === null && !isHeld ? {} : { id: tmdbId }),
    title: title.title,
    sortTitle: title.title.toLowerCase(),
    tmdbId,
    year: title.year ?? 0,
    overview: title.overview ?? '',
    titleSlug: tmdbId.toString(),
    images: imagesOf(title.posterUrl),
    monitored: isHeld || request?.approval === 'approved',
    hasFile: isHeld || (request !== null && isOnDisk(request)),
    isAvailable: true,
    status: 'released',
    minimumAvailability: 'released',
    qualityProfileId,
    rootFolderPath,
    folderName,
    path: `${rootFolderPath.replace(/\/+$/, '')}/${folderName}`,
    tags: [],
    added: request?.createdAt ?? NEVER_ADDED,
    sizeOnDisk: 0,
    runtime: 0,
    genres: [],
  };
};

export { radarrMovieOf };

export type { RadarrMovie };
