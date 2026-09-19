import { z } from 'zod';
import { RequestsStatusSchema } from '@ValenceContracts/schemas/Requests';
import type { RequestsStatus } from '@ValenceContracts/schemas/Requests';

type RequestsReading =
  { kind: 'answered'; status: RequestsStatus } | { kind: 'silent'; reason: string };

type CreateRequestsClientOptions = {
  address: string;
  secret: string;
  fetch: (
    url: string,
    init: { headers: Record<string, string>; signal: AbortSignal },
  ) => Promise<Response>;
  timeoutMs?: number;
};

/**
 * Speaks to the requests service on the server's behalf, presenting the secret the two share.
 *
 * @param address - Where the service answers, such as `http://requests:8421`.
 * @param secret - What both were started with.
 * @param fetch - How to ask.
 * @param timeoutMs - How long to wait for an answer.
 * @returns The client.
 */
const createRequestsClient = ({
  address,
  secret,
  fetch,
  timeoutMs = 5000,
}: CreateRequestsClientOptions) => ({
  readStatus: async (): Promise<RequestsReading> => {
    try {
      const response = await fetch(`${address}/api/status`, {
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.status === 401) {
        return {
          kind: 'silent',
          reason: `${address} refused the secret; REQUESTS_SECRET must be the same on both`,
        };
      }

      if (!response.ok) {
        return { kind: 'silent', reason: `${address} answered ${response.status.toString()}` };
      }

      return { kind: 'answered', status: RequestsStatusSchema.parse(await response.json()) };
    } catch (error) {
      return {
        kind: 'silent',
        reason:
          error instanceof z.ZodError
            ? `${address} answered, but not as the requests service`
            : `${address} did not answer`,
      };
    }
  },
});

type RequestsClient = ReturnType<typeof createRequestsClient>;

export type { RequestsClient, RequestsReading };

export { createRequestsClient };
