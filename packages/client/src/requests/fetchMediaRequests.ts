import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import { ReleaseSearchOutcomeSchema } from '@ValenceContracts/schemas/Indexer';
import {
  CatalogueSeasonSchema,
  MediaRequestSchema,
  MissingSearchSchema,
  MusicCatalogueHitSchema,
  RequestLogEntrySchema,
} from '@ValenceContracts/schemas/MediaRequest';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { Release, ReleaseSearchOutcome } from '@ValenceContracts/schemas/Indexer';
import type {
  CatalogueSeason,
  MediaRequest,
  MediaRequestAsk,
  MediaRequestChange,
  MissingSearch,
  MusicCatalogueHit,
  MusicRequestKind,
  RequestLogEntry,
} from '@ValenceContracts/schemas/MediaRequest';

const REQUESTS = '/api/requests/media';

/**
 * Reads a request from what the server answered.
 *
 * @param response - The answer.
 * @returns The request.
 */
const readRequest = async (response: Response): Promise<MediaRequest> =>
  MediaRequestSchema.parse(await response.json());

/**
 * Reads the requests for films and series somebody may see: everybody's, for whoever approves them,
 * and otherwise their own.
 *
 * @returns The requests, newest first.
 */
const fetchMediaRequests = (): Promise<MediaRequest[]> =>
  readFromServer(REQUESTS, z.array(MediaRequestSchema));

/**
 * Asks for a film, or a series or some of its seasons.
 *
 * @param asked - What to ask for.
 * @returns The request, or why not.
 */
const askForMedia = (asked: MediaRequestAsk): Promise<Sent<MediaRequest>> =>
  sendToRequests(REQUESTS, 'POST', asked, readRequest);

/**
 * Searches by hand for something before asking for it, making no request.
 *
 * @param asked - What would be asked for.
 * @returns What was found, best first, or why not.
 */
const findReleasesFor = (asked: MediaRequestAsk): Promise<Sent<ReleaseSearchOutcome>> =>
  sendToRequests(`${REQUESTS}/releases`, 'POST', asked, async (response) =>
    ReleaseSearchOutcomeSchema.parse(await response.json()),
  );

/**
 * Changes the seasons a request asks for, or what a film waits for.
 *
 * @param id - Which.
 * @param change - What to change.
 * @returns The request, or why not.
 */
const changeMediaRequest = (id: string, change: MediaRequestChange): Promise<Sent<MediaRequest>> =>
  sendToRequests(`${REQUESTS}/${id}`, 'PATCH', change, readRequest);

/**
 * Approves a request, so it is fetched.
 *
 * @param id - Which.
 * @returns The request, or why not.
 */
const approveMediaRequest = (id: string): Promise<Sent<MediaRequest>> =>
  sendToRequests(`${REQUESTS}/${id}/approve`, 'POST', undefined, readRequest);

/**
 * Refuses a request.
 *
 * @param id - Which.
 * @param reason - Why, or nothing.
 * @returns The request, or why not.
 */
const refuseMediaRequest = (id: string, reason: string): Promise<Sent<MediaRequest>> =>
  sendToRequests(`${REQUESTS}/${id}/refuse`, 'POST', { reason }, readRequest);

/**
 * Tries again whatever failed in a request, and searches again for what is wanted.
 *
 * @param id - Which.
 * @returns The request, or why not.
 */
const retryMediaRequest = (id: string): Promise<Sent<MediaRequest>> =>
  sendToRequests(`${REQUESTS}/${id}/retry`, 'POST', undefined, readRequest);

/**
 * Searches for a request by hand, every release judged.
 *
 * @param id - Which.
 * @returns What was found, best first.
 */
const fetchMediaRequestReleases = (id: string): Promise<ReleaseSearchOutcome> =>
  readFromServer(`${REQUESTS}/${id}/releases`, ReleaseSearchOutcomeSchema);

/**
 * Reads the seasons a series has, to choose which to ask for.
 *
 * @param tmdbId - The series' catalogue id.
 * @returns Its seasons, specials first.
 */
const fetchSeriesSeasons = (tmdbId: number): Promise<CatalogueSeason[]> =>
  readFromServer(
    `/api/requests/catalogue/series/${tmdbId.toString()}/seasons`,
    z.array(CatalogueSeasonSchema),
  );

/**
 * Searches MusicBrainz for an artist or an album to ask for.
 *
 * @param query - What was typed.
 * @param kind - Whether artists or albums are looked for.
 * @returns What was found, best matches first.
 */
const searchMusicCatalogue = (
  query: string,
  kind: MusicRequestKind,
): Promise<MusicCatalogueHit[]> =>
  readFromServer(
    `/api/requests/catalogue/music?${new URLSearchParams({ query, kind }).toString()}`,
    z.array(MusicCatalogueHitSchema),
  );

/**
 * Reads what a request has done: every search, what it found, and what became of it.
 *
 * @param id - Which.
 * @returns What it did, newest first.
 */
const fetchMediaRequestLog = (id: string): Promise<RequestLogEntry[]> =>
  readFromServer(`${REQUESTS}/${id}/log`, z.array(RequestLogEntrySchema));

/**
 * Fetches a release picked by hand for a request.
 *
 * @param id - Which request.
 * @param release - The release.
 * @returns The request, or why not.
 */
const pickMediaRelease = (id: string, release: Release): Promise<Sent<MediaRequest>> =>
  sendToRequests(`${REQUESTS}/${id}/pick`, 'POST', { release }, readRequest);

/**
 * Forgets a request — or cancels it, taking with it whatever it had started downloading, files
 * and all.
 *
 * @param id - Which.
 * @param isDeletingDownloads - Whether what it had started downloading goes too.
 * @returns Why not, or nothing where it went.
 */
const removeMediaRequest = async (id: string, isDeletingDownloads = false): Promise<Refusal> =>
  (
    await sendToRequests(
      `${REQUESTS}/${id}${isDeletingDownloads ? '?deleteDownloads=true' : ''}`,
      'DELETE',
      undefined,
      () => Promise.resolve(null),
    )
  ).refusal;

/**
 * Searches now for everything still wanted, and anything a profile would upgrade.
 *
 * @returns How many requests were searched for, or why not.
 */
const searchMissing = (): Promise<Sent<MissingSearch>> =>
  sendToRequests(`${REQUESTS}/missing`, 'POST', undefined, async (response) =>
    MissingSearchSchema.parse(await response.json()),
  );

export {
  approveMediaRequest,
  askForMedia,
  changeMediaRequest,
  fetchMediaRequestLog,
  fetchMediaRequestReleases,
  fetchMediaRequests,
  fetchSeriesSeasons,
  findReleasesFor,
  pickMediaRelease,
  refuseMediaRequest,
  removeMediaRequest,
  retryMediaRequest,
  searchMissing,
  searchMusicCatalogue,
};
