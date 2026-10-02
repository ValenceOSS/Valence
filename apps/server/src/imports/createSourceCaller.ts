import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { saying } from '@ValenceI18n/saying';
import { SourceFailure } from './SourceFailure';
import type { SourcePicture } from './SourceReader';

type SourceFetch = (
  url: string,
  init: { method: 'GET' | 'POST'; headers: Record<string, string>; signal: AbortSignal },
) => Promise<Response>;

type SourceReading<Value> = {
  safeParse: (body: JsonValue) => { success: true; data: Value } | { success: false };
};

type SourceAsking = {
  query?: Record<string, string>;
  headers?: Record<string, string>;
};

type SourceCallerOptions = {
  fetch: SourceFetch;
  base: string;
  name: string;
  headers: Record<string, string>;
  waitSeconds?: number;
};

const WAIT_SECONDS = 60;

const PICTURE_TYPES = /^image\/(jpeg|png|webp|gif)/;

/**
 * Reads from a Jellyfin, Emby or Plex server, or from plex.tv, over plain HTTP on whatever address
 * it was given, turning every way that can fail into a failure that says so.
 *
 * @param options - How to fetch, where the source answers, what it is called and the headers that
 *   carry its key.
 * @returns How to read json, text and pictures from it, and the one account switch Plex needs.
 */
const createSourceCaller = ({
  fetch,
  base,
  name,
  headers,
  waitSeconds = WAIT_SECONDS,
}: SourceCallerOptions) => {
  const root = base.replace(/\/+$/, '');

  const addressOf = (path: string, query: Record<string, string>): string => {
    const address = new URL(/^https?:\/\//i.test(path) ? path : `${root}${path}`);

    for (const [key, value] of Object.entries(query)) {
      address.searchParams.set(key, value);
    }

    return address.toString();
  };

  const call = async (
    method: 'GET' | 'POST',
    path: string,
    { query = {}, headers: extra = {} }: SourceAsking,
  ): Promise<Response> => {
    let response: Response;

    try {
      response = await fetch(addressOf(path, query), {
        method,
        headers: { ...headers, ...extra },
        signal: AbortSignal.timeout(waitSeconds * 1000),
      });
    } catch (error) {
      throw new SourceFailure(
        error instanceof Error && error.name === 'TimeoutError'
          ? saying('server.imports.sourceCaller.nameDidNotAnswerInTime', { name })
          : saying('server.imports.sourceCaller.nameCouldNotBeReached', { name }),
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new SourceFailure(
        saying('server.imports.sourceCaller.nameRefusedTheKey', { name }),
        response.status,
      );
    }

    if (!response.ok) {
      throw new SourceFailure(
        saying('server.imports.sourceCaller.nameAnsweredStatusAtPath', {
          name,
          status: response.status.toString(),
          path,
        }),
        response.status,
      );
    }

    return response;
  };

  const readJson = async <Value>(
    path: string,
    reading: SourceReading<Value>,
    asking: SourceAsking,
  ): Promise<Value> => {
    const response = await call('GET', path, {
      ...asking,
      headers: { accept: 'application/json', ...asking.headers },
    });
    const text = await response.text().catch(() => '');
    let body: JsonValue = null;

    try {
      body = text === '' ? null : JsonValueSchema.parse(JSON.parse(text));
    } catch {
      body = null;
    }

    const parsed = reading.safeParse(body);

    if (!parsed.success) {
      throw new SourceFailure(
        saying('server.imports.sourceCaller.nameAnsweredPathInAShapeValenceCannotRead', {
          name,
          path,
        }),
      );
    }

    return parsed.data;
  };

  return {
    json: <Value>(
      path: string,
      reading: SourceReading<Value>,
      asking: SourceAsking = {},
    ): Promise<Value> => readJson(path, reading, asking),

    jsonOrNothing: async <Value>(
      path: string,
      reading: SourceReading<Value>,
      asking: SourceAsking = {},
    ): Promise<Value | null> => {
      try {
        return await readJson(path, reading, asking);
      } catch (error) {
        if (error instanceof SourceFailure && (error.status === 404 || error.status === 400)) {
          return null;
        }

        throw error;
      }
    },

    text: async (path: string, asking: SourceAsking = {}): Promise<string> =>
      (await call('GET', path, asking)).text(),

    picture: async (path: string, asking: SourceAsking = {}): Promise<SourcePicture | null> => {
      const response = await call('GET', path, asking).catch(() => null);

      if (response === null) {
        return null;
      }

      const contentType = response.headers.get('content-type') ?? '';

      if (!PICTURE_TYPES.test(contentType)) {
        return null;
      }

      return { body: new Uint8Array(await response.arrayBuffer()), contentType };
    },

    switchAccount: async (path: string, asking: SourceAsking = {}): Promise<string> =>
      (await call('POST', path, asking)).text(),
  };
};

type SourceCaller = ReturnType<typeof createSourceCaller>;

export type { SourceCaller, SourceFetch, SourceReading };

export { createSourceCaller };
