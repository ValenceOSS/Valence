import { z } from 'zod';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import type { SeerrSetup, SourceRead } from '@ValenceRequests/arrImport/ArrSetup';
import { seerrServerAddressOf } from '@ValenceRequests/arrImport/seerrServerAddressOf';
import { SeerrArrServerSchema } from '@ValenceRequests/arrImport/schemas/SeerrArrServerSchema';
import { SeerrRequestPageSchema } from '@ValenceRequests/arrImport/schemas/SeerrRequestPageSchema';
import type { SeerrRequest } from '@ValenceRequests/arrImport/schemas/SeerrRequestPageSchema';

const PAGE = 100;

const MOST_PAGES = 200;

const SeerrServersSchema = z.array(SeerrArrServerSchema);

/**
 * Reads what an Overseerr or Jellyseerr knows that Valence carries across: the Radarr and Sonarr
 * servers it sends requests to, with the keys it keeps for them, and every request still waiting
 * for its media — asked a page at a time, and never changed.
 *
 * @param caller - How to ask it.
 * @param source - Which app it is.
 * @returns What it knows.
 */
const readSeerrSetup = async (
  caller: Pick<ArrCaller, 'read'>,
  source: SourceRead,
): Promise<SeerrSetup> => {
  const [radarrs, sonarrs] = await Promise.all([
    caller.read('/settings/radarr', SeerrServersSchema),
    caller.read('/settings/sonarr', SeerrServersSchema),
  ]);
  const requests: SeerrRequest[] = [];

  for (let page = 0; page < MOST_PAGES; page += 1) {
    const read = await caller.read('/request', SeerrRequestPageSchema, {
      take: PAGE.toString(),
      skip: (page * PAGE).toString(),
      filter: 'unavailable',
      sort: 'added',
    });

    requests.push(...read.results);

    if (read.results.length < PAGE || page + 1 >= read.pageInfo.pages) {
      break;
    }
  }

  return {
    source,
    servers: [
      ...radarrs.map((server) => ({
        ...server,
        kind: 'radarr' as const,
        url: seerrServerAddressOf(server),
      })),
      ...sonarrs.map((server) => ({
        ...server,
        kind: 'sonarr' as const,
        url: seerrServerAddressOf(server),
      })),
    ],
    requests,
  };
};

export { readSeerrSetup };
