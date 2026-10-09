import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { ArrImportSourceKind } from '@ValenceContracts/schemas/ArrImport';
import { ArrAppFailure } from '@ValenceRequests/arrApps/ArrAppFailure';
import type { ArrAppRecord } from '@ValenceRequests/arrApps/ArrAppRecord';
import { saying } from '@ValenceI18n/saying';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';

type ArrFetch = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    signal: AbortSignal;
  },
) => Promise<Response>;

type ArrReader<Value> = {
  safeParse: (body: JsonValue) => { success: true; data: Value } | { success: false };
};

type ArrAsking = {
  query?: Record<string, string>;
  body?: JsonValue;
};

type ArrCalled = Pick<ArrAppRecord, 'name' | 'url' | 'apiKey'> & { kind: ArrImportSourceKind };

const API_ROOTS: Readonly<Record<ArrImportSourceKind, string>> = {
  radarr: '/api/v3',
  sonarr: '/api/v3',
  lidarr: '/api/v1',
  prowlarr: '/api/v1',
  overseerr: '/api/v1',
  jellyseerr: '/api/v1',
};

const WAIT_SECONDS = 20;

const ArrErrorSchema = z.union([
  z.object({ message: z.string() }),
  z.array(z.object({ errorMessage: z.string() })).min(1),
]);

/**
 * What an app said was wrong, where it said anything that can be read.
 *
 * @param body - What it answered with.
 * @returns Its words, or null.
 */
const complaintIn = (body: JsonValue): string | null => {
  const read = ArrErrorSchema.safeParse(body);

  if (!read.success) {
    return null;
  }

  return 'message' in read.data
    ? read.data.message
    : read.data.map((one) => one.errorMessage).join(' ');
};

/**
 * Asks Radarr, Sonarr, Lidarr, Prowlarr, Overseerr or Jellyseerr something through its own API with
 * the key it was given, reading every answer through a schema, and turning an app that cannot be
 * reached, refuses its key or answers in a shape that cannot be read into a failure that says so in
 * words.
 *
 * @param fetch - How to ask.
 * @param app - The app: what it is called, which kind it is, where it answers and its key.
 * @param waitSeconds - How long to wait for an answer.
 * @returns How to read from it and send to it.
 */
const createArrCaller = (fetch: ArrFetch, app: ArrCalled, waitSeconds = WAIT_SECONDS) => {
  const { name } = app;

  const ask = async <Value>(
    method: string,
    path: string,
    reader: ArrReader<Value>,
    { query = {}, body }: ArrAsking,
  ): Promise<Value> => {
    const address = new URL(`${app.url.replace(/\/+$/, '')}${API_ROOTS[app.kind]}${path}`);

    for (const [key, value] of Object.entries(query)) {
      address.searchParams.set(key, value);
    }

    let response: Response;

    try {
      response = await fetch(address.toString(), {
        method,
        headers: {
          'X-Api-Key': app.apiKey,
          accept: 'application/json',
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(waitSeconds * 1000),
      });
    } catch (error) {
      throw new ArrAppFailure(
        error instanceof Error && error.name === 'TimeoutError'
          ? saying('requests.downloads.clientCaller.nameDidNotAnswerWithinWaitSeconds', {
              name,
              waitSeconds: waitSeconds.toString(),
            })
          : saying('requests.downloads.clientCaller.nameCouldNotBeReached', { name }),
        'ArrAppUnreachable',
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new ArrAppFailure(
        saying('requests.arrApps.arrCaller.nameRefusedItsApiKey', { name }),
        'ArrAppKeyRefused',
      );
    }

    const text = await response.text().catch(() => '');
    let read: JsonValue = null;

    try {
      read = text === '' ? null : JsonValueSchema.parse(JSON.parse(text));
    } catch {
      read = null;
    }

    if (!response.ok) {
      const complaint = complaintIn(read);

      throw new ArrAppFailure(
        complaint === null
          ? saying('requests.arrApps.arrCaller.nameAnsweredStatus', {
              name,
              status: response.status.toString(),
            })
          : saying('requests.arrApps.arrCaller.nameAnsweredStatusComplaint', {
              name,
              status: response.status.toString(),
              complaint: sayVerbatim(complaint),
            }),
        null,
        response.status,
      );
    }

    const parsed = reader.safeParse(read);

    if (!parsed.success) {
      throw new ArrAppFailure(
        saying('requests.arrApps.arrCaller.nameAnsweredInAShapeValenceCannotRead', { name }),
      );
    }

    return parsed.data;
  };

  return {
    read: <Value>(
      path: string,
      reader: ArrReader<Value>,
      query: Record<string, string> = {},
    ): Promise<Value> => ask('GET', path, reader, { query }),

    send: <Value>(
      method: 'POST' | 'PUT',
      path: string,
      body: JsonValue,
      reader: ArrReader<Value>,
    ): Promise<Value> => ask(method, path, reader, { body }),

    remove: async (path: string, query: Record<string, string> = {}): Promise<void> => {
      await ask('DELETE', path, JsonValueSchema, { query });
    },
  };
};

type ArrCaller = ReturnType<typeof createArrCaller>;

export type { ArrCaller, ArrFetch, ArrReader };

export { createArrCaller };
