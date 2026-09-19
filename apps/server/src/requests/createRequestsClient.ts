import { z } from 'zod';
import {
  IndexerSchema,
  IndexerTestSchema,
  ReleaseSearchOutcomeSchema,
} from '@ValenceContracts/schemas/Indexer';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { RequestsStatusSchema } from '@ValenceContracts/schemas/Requests';
import type {
  Indexer,
  IndexerChange,
  IndexerDraft,
  IndexerTest,
  ReleaseSearch,
  ReleaseSearchOutcome,
} from '@ValenceContracts/schemas/Indexer';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { RequestsStatus } from '@ValenceContracts/schemas/Requests';

type RequestsReading =
  { kind: 'answered'; status: RequestsStatus } | { kind: 'silent'; reason: string };

type RequestsAnswer<Value> =
  | { kind: 'answered'; value: Value }
  | { kind: 'refused'; status: 400 | 404; error: string }
  | { kind: 'silent'; reason: string };

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

const RefusalSchema = z.object({ error: z.string() });

const SEARCH_TIMEOUT_MS = 150_000;

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
          reason: `${address} refused the secret; REQUESTS_SECRET must be the same on both`,
        };
      }

      if (response.status === 400 || response.status === 404) {
        const refusal = RefusalSchema.safeParse(await response.json().catch(() => ({})));

        return {
          kind: 'refused',
          status: response.status,
          error: refusal.success ? refusal.data.error : 'The requests service refused that.',
        };
      }

      if (!response.ok) {
        return { kind: 'silent', reason: `${address} answered ${response.status.toString()}` };
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
            ? `${address} answered, but not as the requests service`
            : `${address} did not answer`,
      };
    }
  };

  const withIndexer = (id: string) => `/api/indexers/${encodeURIComponent(id)}`;

  return {
    readStatus: async (): Promise<RequestsReading> => {
      const answer = await call('/api/status', (body) => RequestsStatusSchema.parse(body));

      return answer.kind === 'answered'
        ? { kind: 'answered', status: answer.value }
        : {
            kind: 'silent',
            reason:
              answer.kind === 'silent' ? answer.reason : `${address} refused to say how it is`,
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

    search: (search: ReleaseSearch): Promise<RequestsAnswer<ReleaseSearchOutcome>> =>
      call('/api/search', (body) => ReleaseSearchOutcomeSchema.parse(body), {
        method: 'POST',
        body: search,
        waitMs: searchTimeoutMs,
      }),
  };
};

type RequestsClient = ReturnType<typeof createRequestsClient>;

export type { RequestsAnswer, RequestsClient, RequestsReading };

export { createRequestsClient };
