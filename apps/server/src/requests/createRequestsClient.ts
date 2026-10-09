import { refuseWith } from '@ValenceI18n/refuseWith';
import { saidFrom } from '@ValenceI18n/saidFrom';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { saying } from '@ValenceI18n/saying';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { RefusalBody } from '@ValenceI18n/RefusalBody';
import { refuse } from '@ValenceI18n/refuse';
import { z } from 'zod';
import {
  IndexerSchema,
  IndexerTestSchema,
  ReleaseSearchOutcomeSchema,
} from '@ValenceContracts/schemas/Indexer';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import {
  IndexerCatalogueSchema,
  IndexerDefinitionDetailSchema,
} from '@ValenceContracts/schemas/IndexerDefinition';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';
import type {
  IndexerCatalogue,
  IndexerDefinitionDetail,
} from '@ValenceContracts/schemas/IndexerDefinition';
import { RequestsStatusSchema } from '@ValenceContracts/schemas/Requests';
import {
  DownloadClientSchema,
  DownloadClientTestSchema,
} from '@ValenceContracts/schemas/DownloadClient';
import {
  DownloadQueueSchema,
  DownloadStreamFrameSchema,
  QueuedDownloadSchema,
} from '@ValenceContracts/schemas/DownloadQueue';
import { readServerSentEvents } from '@ValenceServer/requests/readServerSentEvents';
import { GiveUpRulesSchema } from '@ValenceContracts/schemas/GiveUpRules';
import type { GiveUpRules } from '@ValenceContracts/schemas/GiveUpRules';
import { QualityProfileSchema } from '@ValenceContracts/schemas/QualityProfile';
import type {
  QualityProfile,
  QualityProfileChange,
  QualityProfileDraft,
} from '@ValenceContracts/schemas/QualityProfile';
import type {
  DownloadClient,
  DownloadClientChange,
  DownloadClientDraft,
  DownloadClientTest,
} from '@ValenceContracts/schemas/DownloadClient';
import type {
  DownloadQueue,
  DownloadStreamFrame,
  QueuedDownload,
  ReleaseSend,
} from '@ValenceContracts/schemas/DownloadQueue';
import type {
  Indexer,
  IndexerChange,
  IndexerDraft,
  IndexerTest,
  Release,
  ReleaseSearch,
  ReleaseSearchOutcome,
} from '@ValenceContracts/schemas/Indexer';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type {
  BlockedRelease,
  DownloadStop,
  FollowedRequest,
  MediaRequest,
  MediaRequestAdded,
  MediaRequestFollow,
  MediaRequestArrivals,
  MediaRequestArrived,
  MediaRequestDeparture,
  MediaRequestDraft,
  MediaRequestRevision,
  MissingSearch,
  RequestCatalogueUpdate,
  RequestLogEntry,
} from '@ValenceContracts/schemas/MediaRequest';
import {
  FollowedRequestSchema,
  BlockedReleaseSchema,
  MediaRequestAddedSchema,
  MediaRequestArrivedSchema,
  MediaRequestSchema,
  MissingSearchSchema,
  RequestLogEntrySchema,
} from '@ValenceContracts/schemas/MediaRequest';
import type { RequestsStatus } from '@ValenceContracts/schemas/Requests';
import {
  ArrAppChoicesSchema,
  ArrAppSchema,
  ArrAppTestSchema,
  ArrQueueSchema,
  ProwlarrImportSchema,
} from '@ValenceContracts/schemas/ArrApp';
import type {
  ArrApp,
  ArrAppChange,
  ArrAppChoices,
  ArrAppDraft,
  ArrAppTest,
  ArrQueue,
  ProwlarrImport,
} from '@ValenceContracts/schemas/ArrApp';
import { ArrImportAppliedSchema, ArrImportPlanSchema } from '@ValenceContracts/schemas/ArrImport';
import type {
  ArrImportApplied,
  ArrImportOrder,
  ArrImportPlan,
} from '@ValenceContracts/schemas/ArrImport';

type RequestsReading =
  | { kind: 'answered'; status: RequestsStatus }
  | { kind: 'silent'; reason: Said; problemCode: ProblemCode };

type RequestsAnswer<Value> =
  | { kind: 'answered'; value: Value }
  | { kind: 'refused'; status: 400 | 404; refusal: RefusalBody }
  | { kind: 'silent'; reason: Said; problemCode: ProblemCode };

type ReleaseDownload =
  | { kind: 'magnet'; url: string }
  | { kind: 'file'; bytes: Uint8Array; contentType: string };

type RequestsFetch = (
  url: string,
  init: {
    method?: string;
    headers: Record<string, string>;
    body?: string;
    signal: AbortSignal;
  },
) => Promise<Response>;

type CreateRequestsClientOptions = {
  address: string;
  secret: string;
  fetch: RequestsFetch;
  timeoutMs?: number;
  searchTimeoutMs?: number;
};

const SEARCH_TIMEOUT_MS = 150_000;

const REFRESH_TIMEOUT_MS = 300_000;

const MagnetSchema = z.object({ magnet: z.string() });

const CLIENT_TIMEOUT_MS = 30_000;

/**
 * Speaks to the requests service on the server's behalf, presenting the secret the two share.
 *
 * Every call says which of three things happened: the service answered, it refused what it was
 * asked (a 400 or 404, passed on as the service worded it), or it could not be heard at all — so a
 * route in front of it can tell a mistake in the question from a service that is down.
 *
 * @param address - Where the service answers, such as `http://requests:8421`.
 * @param secret - What both were started with.
 * @param fetch - How to ask.
 * @param timeoutMs - How long to wait for an ordinary answer.
 * @param searchTimeoutMs - How long to wait for a search, which asks every indexer in turn.
 * @returns The client.
 */
const createRequestsClient = ({
  address,
  secret,
  fetch,
  timeoutMs = 5000,
  searchTimeoutMs = SEARCH_TIMEOUT_MS,
}: CreateRequestsClientOptions) => {
  const call = async <Value>(
    path: string,
    read: (body: JsonValue) => Value,
    {
      method = 'GET',
      body,
      waitMs = timeoutMs,
    }: { method?: string; body?: object; waitMs?: number } = {},
  ): Promise<RequestsAnswer<Value>> => {
    try {
      const response = await fetch(`${address}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${secret}`,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(waitMs),
      });

      if (response.status === 401) {
        return {
          kind: 'silent',
          reason: saying('server.requests.requestsClient.secretRefused', {
            address,
          }),
          problemCode: 'RequestsSecretRefused',
        };
      }

      if (response.status === 400 || response.status === 404) {
        const refusal = RefusalSchema.safeParse(await response.json().catch(() => ({})));

        return {
          kind: 'refused',
          status: response.status,
          refusal: refusal.success
            ? refusal.data
            : refuse('server.requests.requestsClient.theRequestsServiceRefusedThat'),
        };
      }

      if (!response.ok) {
        return {
          kind: 'silent',
          reason: saying('server.requests.addressAnsweredStatus', {
            address,
            status: response.status,
          }),
          problemCode: 'RequestsUnreachable',
        };
      }

      if (response.status === 204) {
        return { kind: 'answered', value: read(null) };
      }

      return { kind: 'answered', value: read(JsonValueSchema.parse(await response.json())) };
    } catch (error) {
      return {
        kind: 'silent',
        reason:
          error instanceof z.ZodError || error instanceof SyntaxError
            ? saying('server.requests.requestsClient.addressAnsweredButNotAsThe', { address })
            : saying('server.requests.requestsClient.addressDidNotAnswer', { address }),
        problemCode: 'RequestsUnreachable',
      };
    }
  };

  const withIndexer = (id: string) => `/api/indexers/${encodeURIComponent(id)}`;

  const withClient = (id: string) => `/api/clients/${encodeURIComponent(id)}`;

  const withDownload = (id: string) => `/api/downloads/${encodeURIComponent(id)}`;

  const withProfile = (id: string) => `/api/profiles/${encodeURIComponent(id)}`;

  const withRequest = (id: string) => `/api/requests/${encodeURIComponent(id)}`;

  const withArrApp = (id: string) => `/api/arr-apps/${encodeURIComponent(id)}`;

  const readRequest = (body: JsonValue) => MediaRequestSchema.parse(body);

  return {
    readStatus: async (): Promise<RequestsReading> => {
      const answer = await call('/api/status', (body) => RequestsStatusSchema.parse(body));

      return answer.kind === 'answered'
        ? { kind: 'answered', status: answer.value }
        : {
            kind: 'silent',
            reason:
              answer.kind === 'silent'
                ? answer.reason
                : saying('server.requests.requestsClient.addressRefusedToSayHowIt', { address }),
            problemCode: answer.kind === 'silent' ? answer.problemCode : 'RequestsUnreachable',
          };
    },

    listIndexers: (): Promise<RequestsAnswer<Indexer[]>> =>
      call('/api/indexers', (body) => z.array(IndexerSchema).parse(body)),

    addIndexer: (draft: IndexerDraft): Promise<RequestsAnswer<Indexer>> =>
      call('/api/indexers', (body) => IndexerSchema.parse(body), { method: 'POST', body: draft }),

    changeIndexer: (id: string, change: IndexerChange): Promise<RequestsAnswer<Indexer>> =>
      call(withIndexer(id), (body) => IndexerSchema.parse(body), { method: 'PATCH', body: change }),

    removeIndexer: (id: string): Promise<RequestsAnswer<null>> =>
      call(withIndexer(id), () => null, { method: 'DELETE' }),

    testIndexer: (id: string): Promise<RequestsAnswer<IndexerTest>> =>
      call(`${withIndexer(id)}/test`, (body) => IndexerTestSchema.parse(body), {
        method: 'POST',
        waitMs: searchTimeoutMs,
      }),

    tryIndexer: (draft: IndexerDraft, id?: string): Promise<RequestsAnswer<IndexerTest>> =>
      call(
        id === undefined ? '/api/indexers/try' : `${withIndexer(id)}/try`,
        (body) => IndexerTestSchema.parse(body),
        { method: 'POST', body: draft, waitMs: searchTimeoutMs },
      ),

    catalogue: (): Promise<RequestsAnswer<IndexerCatalogue>> =>
      call('/api/definitions', (body) => IndexerCatalogueSchema.parse(body), {
        waitMs: searchTimeoutMs,
      }),

    refreshCatalogue: (): Promise<RequestsAnswer<IndexerCatalogue>> =>
      call('/api/definitions/refresh', (body) => IndexerCatalogueSchema.parse(body), {
        method: 'POST',
        waitMs: REFRESH_TIMEOUT_MS,
      }),

    definition: (id: string): Promise<RequestsAnswer<IndexerDefinitionDetail>> =>
      call(`/api/definitions/${encodeURIComponent(id)}`, (body) =>
        IndexerDefinitionDetailSchema.parse(body),
      ),

    download: async (id: string, url: string): Promise<RequestsAnswer<ReleaseDownload>> => {
      try {
        const response = await fetch(`${address}${withIndexer(id)}/download`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: AbortSignal.timeout(searchTimeoutMs),
        });
        const contentType = response.headers.get('content-type') ?? '';

        if (response.ok && contentType.includes('json')) {
          return {
            kind: 'answered',
            value: { kind: 'magnet', url: MagnetSchema.parse(await response.json()).magnet },
          };
        }

        if (response.ok) {
          return {
            kind: 'answered',
            value: {
              kind: 'file',
              bytes: new Uint8Array(await response.arrayBuffer()),
              contentType,
            },
          };
        }

        const refusal = RefusalSchema.safeParse(await response.json().catch(() => ({})));
        const said = refusal.success
          ? saidFrom(refusal.data)
          : saying('server.requests.addressAnsweredStatus', { address, status: response.status });

        return response.status === 400 || response.status === 404
          ? { kind: 'refused', status: response.status, refusal: refuseWith(said) }
          : { kind: 'silent', reason: said, problemCode: 'RequestsUnreachable' };
      } catch {
        return {
          kind: 'silent',
          reason: saying('server.requests.requestsClient.addressDidNotAnswer', { address }),
          problemCode: 'RequestsUnreachable',
        };
      }
    },

    listProfiles: (): Promise<RequestsAnswer<QualityProfile[]>> =>
      call('/api/profiles', (body) => z.array(QualityProfileSchema).parse(body)),

    addProfile: (draft: QualityProfileDraft): Promise<RequestsAnswer<QualityProfile>> =>
      call('/api/profiles', (body) => QualityProfileSchema.parse(body), {
        method: 'POST',
        body: draft,
      }),

    changeProfile: (
      id: string,
      change: QualityProfileChange,
    ): Promise<RequestsAnswer<QualityProfile>> =>
      call(withProfile(id), (body) => QualityProfileSchema.parse(body), {
        method: 'PATCH',
        body: change,
      }),

    removeProfile: (id: string): Promise<RequestsAnswer<null>> =>
      call(withProfile(id), () => null, { method: 'DELETE' }),

    readGiveUpRules: (): Promise<RequestsAnswer<GiveUpRules>> =>
      call('/api/give-up-rules', (body) => GiveUpRulesSchema.parse(body)),

    changeGiveUpRules: (rules: GiveUpRules): Promise<RequestsAnswer<GiveUpRules>> =>
      call('/api/give-up-rules', (body) => GiveUpRulesSchema.parse(body), {
        method: 'PUT',
        body: rules,
      }),

    listClients: (): Promise<RequestsAnswer<DownloadClient[]>> =>
      call('/api/clients', (body) => z.array(DownloadClientSchema).parse(body)),

    addClient: (draft: DownloadClientDraft): Promise<RequestsAnswer<DownloadClient>> =>
      call('/api/clients', (body) => DownloadClientSchema.parse(body), {
        method: 'POST',
        body: draft,
      }),

    changeClient: (
      id: string,
      change: DownloadClientChange,
    ): Promise<RequestsAnswer<DownloadClient>> =>
      call(withClient(id), (body) => DownloadClientSchema.parse(body), {
        method: 'PATCH',
        body: change,
      }),

    removeClient: (id: string): Promise<RequestsAnswer<null>> =>
      call(withClient(id), () => null, { method: 'DELETE' }),

    testClient: (id: string): Promise<RequestsAnswer<DownloadClientTest>> =>
      call(`${withClient(id)}/test`, (body) => DownloadClientTestSchema.parse(body), {
        method: 'POST',
        waitMs: CLIENT_TIMEOUT_MS,
      }),

    tryClient: (
      draft: DownloadClientDraft,
      id?: string,
    ): Promise<RequestsAnswer<DownloadClientTest>> =>
      call(
        id === undefined ? '/api/clients/try' : `${withClient(id)}/try`,
        (body) => DownloadClientTestSchema.parse(body),
        { method: 'POST', body: draft, waitMs: CLIENT_TIMEOUT_MS },
      ),

    downloads: (): Promise<RequestsAnswer<DownloadQueue>> =>
      call('/api/downloads', (body) => DownloadQueueSchema.parse(body)),

    sendRelease: (release: ReleaseSend): Promise<RequestsAnswer<QueuedDownload>> =>
      call('/api/downloads', (body) => QueuedDownloadSchema.parse(body), {
        method: 'POST',
        body: release,
        waitMs: searchTimeoutMs,
      }),

    pauseDownload: (id: string): Promise<RequestsAnswer<QueuedDownload>> =>
      call(`${withDownload(id)}/pause`, (body) => QueuedDownloadSchema.parse(body), {
        method: 'POST',
        waitMs: CLIENT_TIMEOUT_MS,
      }),

    resumeDownload: (id: string): Promise<RequestsAnswer<QueuedDownload>> =>
      call(`${withDownload(id)}/resume`, (body) => QueuedDownloadSchema.parse(body), {
        method: 'POST',
        waitMs: CLIENT_TIMEOUT_MS,
      }),

    fileDownload: (
      id: string,
      library: { id: string; path: string },
    ): Promise<RequestsAnswer<QueuedDownload>> =>
      call(`${withDownload(id)}/file`, (body) => QueuedDownloadSchema.parse(body), {
        method: 'POST',
        body: { library },
        waitMs: REFRESH_TIMEOUT_MS,
      }),

    removeDownload: (id: string, deleteData: boolean): Promise<RequestsAnswer<null>> =>
      call(`${withDownload(id)}?deleteData=${deleteData ? 'true' : 'false'}`, () => null, {
        method: 'DELETE',
        waitMs: CLIENT_TIMEOUT_MS,
      }),

    watchDownloads: (isWatching: boolean): Promise<RequestsAnswer<null>> =>
      call('/api/downloads/watch', () => null, { method: 'POST', body: { isWatching } }),

    acknowledgeDownloadEvents: (ids: readonly number[]): Promise<RequestsAnswer<null>> =>
      call('/api/downloads/events/ack', () => null, { method: 'POST', body: { ids } }),

    streamDownloads: async (
      onFrame: (frame: DownloadStreamFrame) => void,
      signal: AbortSignal,
    ): Promise<Said> => {
      let response: Response;

      try {
        response = await fetch(`${address}/api/downloads/stream`, {
          headers: { Authorization: `Bearer ${secret}`, accept: 'text/event-stream' },
          signal,
        });
      } catch {
        return saying('server.requests.requestsClient.addressDidNotAnswer', { address });
      }

      if (!response.ok || response.body === null) {
        return saying('server.requests.addressAnsweredStatus', {
          address,
          status: response.status,
        });
      }

      try {
        await readServerSentEvents(response.body, (data) => {
          let read: JsonValue = null;

          try {
            read = JsonValueSchema.parse(JSON.parse(data));
          } catch {
            return;
          }

          const frame = DownloadStreamFrameSchema.safeParse(read);

          if (frame.success) {
            onFrame(frame.data);
          }
        });
      } catch {
        return saying('server.requests.requestsClient.addressStoppedStreamingTheDownloads', {
          address,
        });
      }

      return saying('server.requests.requestsClient.addressClosedTheStreamOfDownloads', {
        address,
      });
    },

    listRequests: (): Promise<RequestsAnswer<MediaRequest[]>> =>
      call('/api/requests', (body) => z.array(MediaRequestSchema).parse(body)),

    findRequest: (id: string): Promise<RequestsAnswer<MediaRequest>> =>
      call(withRequest(id), readRequest),

    addRequest: (draft: MediaRequestDraft): Promise<RequestsAnswer<MediaRequestAdded>> =>
      call('/api/requests', (body) => MediaRequestAddedSchema.parse(body), {
        method: 'POST',
        body: draft,
      }),

    changeRequest: (
      id: string,
      revision: MediaRequestRevision,
    ): Promise<RequestsAnswer<MediaRequest>> =>
      call(withRequest(id), readRequest, { method: 'PATCH', body: revision }),

    approveRequest: (id: string): Promise<RequestsAnswer<MediaRequest>> =>
      call(`${withRequest(id)}/approve`, readRequest, { method: 'POST' }),

    refuseRequest: (id: string, reason: string): Promise<RequestsAnswer<MediaRequest>> =>
      call(`${withRequest(id)}/refuse`, readRequest, { method: 'POST', body: { reason } }),

    retryRequest: (id: string): Promise<RequestsAnswer<MediaRequest>> =>
      call(`${withRequest(id)}/retry`, readRequest, { method: 'POST' }),

    fulfilRequest: (id: string): Promise<RequestsAnswer<MediaRequest>> =>
      call(`${withRequest(id)}/fulfil`, readRequest, { method: 'POST' }),

    requestArrived: (id: string, mediaId: string): Promise<RequestsAnswer<MediaRequestArrived>> =>
      call(`${withRequest(id)}/arrived`, (body) => MediaRequestArrivedSchema.parse(body), {
        method: 'POST',
        body: { mediaId },
      }),

    requestArrivedInLibrary: (
      id: string,
      arrivals: MediaRequestArrivals,
    ): Promise<RequestsAnswer<MediaRequestArrived>> =>
      call(`${withRequest(id)}/arrivals`, (body) => MediaRequestArrivedSchema.parse(body), {
        method: 'POST',
        body: arrivals,
      }),

    requestLeft: (
      id: string,
      departure: MediaRequestDeparture,
    ): Promise<RequestsAnswer<MediaRequest>> =>
      call(`${withRequest(id)}/left`, readRequest, { method: 'POST', body: departure }),

    listArrApps: (): Promise<RequestsAnswer<ArrApp[]>> =>
      call('/api/arr-apps', (body) => z.array(ArrAppSchema).parse(body)),

    addArrApp: (draft: ArrAppDraft): Promise<RequestsAnswer<ArrApp>> =>
      call('/api/arr-apps', (body) => ArrAppSchema.parse(body), { method: 'POST', body: draft }),

    changeArrApp: (id: string, change: ArrAppChange): Promise<RequestsAnswer<ArrApp>> =>
      call(withArrApp(id), (body) => ArrAppSchema.parse(body), { method: 'PATCH', body: change }),

    removeArrApp: (id: string): Promise<RequestsAnswer<null>> =>
      call(withArrApp(id), () => null, { method: 'DELETE' }),

    testArrApp: (id: string): Promise<RequestsAnswer<ArrAppTest>> =>
      call(`${withArrApp(id)}/test`, (body) => ArrAppTestSchema.parse(body), {
        method: 'POST',
        waitMs: CLIENT_TIMEOUT_MS,
      }),

    tryArrApp: (draft: ArrAppDraft, id?: string): Promise<RequestsAnswer<ArrAppTest>> =>
      call(
        id === undefined ? '/api/arr-apps/try' : `${withArrApp(id)}/try`,
        (body) => ArrAppTestSchema.parse(body),
        { method: 'POST', body: draft, waitMs: CLIENT_TIMEOUT_MS },
      ),

    arrAppChoices: (id: string): Promise<RequestsAnswer<ArrAppChoices>> =>
      call(`${withArrApp(id)}/choices`, (body) => ArrAppChoicesSchema.parse(body), {
        waitMs: CLIENT_TIMEOUT_MS,
      }),

    importArrIndexers: (id: string): Promise<RequestsAnswer<ProwlarrImport>> =>
      call(`${withArrApp(id)}/import-indexers`, (body) => ProwlarrImportSchema.parse(body), {
        method: 'POST',
        waitMs: CLIENT_TIMEOUT_MS,
      }),

    arrQueue: (): Promise<RequestsAnswer<ArrQueue>> =>
      call('/api/arr-apps/queue', (body) => ArrQueueSchema.parse(body), {
        waitMs: CLIENT_TIMEOUT_MS,
      }),

    planArrImport: (order: ArrImportOrder): Promise<RequestsAnswer<ArrImportPlan>> =>
      call('/api/imports/arr/plan', (body) => ArrImportPlanSchema.parse(body), {
        method: 'POST',
        body: order,
        waitMs: REFRESH_TIMEOUT_MS,
      }),

    applyArrImport: (order: ArrImportOrder): Promise<RequestsAnswer<ArrImportApplied>> =>
      call('/api/imports/arr/apply', (body) => ArrImportAppliedSchema.parse(body), {
        method: 'POST',
        body: order,
        waitMs: REFRESH_TIMEOUT_MS,
      }),

    updateRequestCatalogue: (
      id: string,
      update: RequestCatalogueUpdate,
    ): Promise<RequestsAnswer<MediaRequest>> =>
      call(`${withRequest(id)}/catalogue`, readRequest, { method: 'PUT', body: update }),

    releasesForDraft: (draft: MediaRequestDraft): Promise<RequestsAnswer<ReleaseSearchOutcome>> =>
      call('/api/requests/releases', (body) => ReleaseSearchOutcomeSchema.parse(body), {
        method: 'POST',
        body: draft,
        waitMs: searchTimeoutMs,
      }),

    requestLog: (id: string): Promise<RequestsAnswer<RequestLogEntry[]>> =>
      call(`${withRequest(id)}/log`, (body) => z.array(RequestLogEntrySchema).parse(body)),

    requestBlocklist: (id: string): Promise<RequestsAnswer<BlockedRelease[]>> =>
      call(`${withRequest(id)}/blocklist`, (body) => z.array(BlockedReleaseSchema).parse(body)),

    liftBlock: (id: string, blockId: string): Promise<RequestsAnswer<null>> =>
      call(`${withRequest(id)}/blocklist/${blockId}`, () => null, { method: 'DELETE' }),

    requestReleases: (id: string): Promise<RequestsAnswer<ReleaseSearchOutcome>> =>
      call(`${withRequest(id)}/releases`, (body) => ReleaseSearchOutcomeSchema.parse(body), {
        waitMs: searchTimeoutMs,
      }),

    pickRelease: (id: string, release: Release): Promise<RequestsAnswer<MediaRequest>> =>
      call(`${withRequest(id)}/pick`, readRequest, {
        method: 'POST',
        body: { release },
        waitMs: searchTimeoutMs,
      }),

    stopDownload: (
      id: string,
      downloadId: string,
      stopping: DownloadStop,
    ): Promise<RequestsAnswer<MediaRequest>> =>
      call(`${withRequest(id)}/downloads/${encodeURIComponent(downloadId)}/stop`, readRequest, {
        method: 'POST',
        body: stopping,
      }),

    followItems: (
      id: string,
      following: MediaRequestFollow,
    ): Promise<RequestsAnswer<MediaRequest>> =>
      call(`${withRequest(id)}/follow`, readRequest, { method: 'POST', body: following }),

    deleteFiled: (id: string): Promise<RequestsAnswer<{ folders: string[] }>> =>
      call(
        `${withRequest(id)}/files/delete`,
        (body) => z.object({ folders: z.array(z.string()) }).parse(body),
        { method: 'POST' },
      ),

    removeRequest: (id: string, isDeletingDownloads = false): Promise<RequestsAnswer<null>> =>
      call(`${withRequest(id)}${isDeletingDownloads ? '?deleteDownloads=true' : ''}`, () => null, {
        method: 'DELETE',
      }),

    followedRequests: (): Promise<RequestsAnswer<FollowedRequest[]>> =>
      call('/api/requests/following', (body) => z.array(FollowedRequestSchema).parse(body)),

    searchMissing: (): Promise<RequestsAnswer<MissingSearch>> =>
      call('/api/requests/missing', (body) => MissingSearchSchema.parse(body), {
        method: 'POST',
        waitMs: REFRESH_TIMEOUT_MS,
      }),

    search: (search: ReleaseSearch): Promise<RequestsAnswer<ReleaseSearchOutcome>> =>
      call('/api/search', (body) => ReleaseSearchOutcomeSchema.parse(body), {
        method: 'POST',
        body: search,
        waitMs: searchTimeoutMs,
      }),
  };
};

type RequestsClient = ReturnType<typeof createRequestsClient>;

export type { ReleaseDownload, RequestsAnswer, RequestsClient, RequestsReading };

export { createRequestsClient };
