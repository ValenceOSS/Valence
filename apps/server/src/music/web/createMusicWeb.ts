import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type WebFetch = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<Response>;

type MusicWeb = {
  json: (url: string) => Promise<JsonValue | null>;
  bytes: (url: string) => Promise<Uint8Array | null>;
};

type MusicWebOptions = {
  userAgent: string;
  spacingMs: Readonly<Record<string, number>>;
  fetchImpl?: WebFetch;
  wait?: (ms: number) => Promise<void>;
  now?: () => number;
  timeoutMs?: number;
};

const DEFAULT_SPACING_MS = 250;

const RETRIES = 2;

const GIVES_UP_AFTER_MS = 20_000;

const BACKOFF_MS = 2000;

/**
 * The server's way out to the services music is described by, made to be a good guest on each.
 *
 * Every request says who is asking, since MusicBrainz refuses anonymous callers and the others ask
 * for the same courtesy. Requests to one site are spaced out by however long that site asks —
 * MusicBrainz one a second, the free TheAudioDB key thirty a minute — and queued rather than fired
 * together, however many albums a scan turns up at once. A site that says it is busy is given a
 * moment and asked again a couple of times before the answer is taken as nothing, and one that does
 * not answer within twenty seconds is given up on, so one slow picture cannot hold a whole scan.
 *
 * Nothing it is asked can fail the caller: an unreachable site, a refusal or an answer that is not
 * what was asked for all come back as nothing.
 *
 * @param options - Who to say is asking, how far apart to space each site's requests, how long to
 *   wait for an answer, and — for a test — how to fetch, wait and tell the time.
 * @returns A way to ask for JSON and for a picture.
 */
const createMusicWeb = ({
  userAgent,
  spacingMs,
  fetchImpl = (url, init) => fetch(url, init),
  wait = async (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = () => Date.now(),
  timeoutMs = GIVES_UP_AFTER_MS,
}: MusicWebOptions): MusicWeb => {
  const nextAllowed = new Map<string, number>();
  const queues = new Map<string, Promise<void>>();

  const inTurn = async <T>(host: string, work: () => Promise<T>): Promise<T> => {
    const before = queues.get(host) ?? Promise.resolve();
    let release = (): void => undefined;
    const mine = new Promise<void>((resolve) => {
      release = resolve;
    });

    queues.set(
      host,
      before.then(async () => mine),
    );

    await before;

    try {
      const gap = (nextAllowed.get(host) ?? 0) - now();

      if (gap > 0) {
        await wait(gap);
      }

      nextAllowed.set(host, now() + (spacingMs[host] ?? DEFAULT_SPACING_MS));

      return await work();
    } finally {
      release();
    }
  };

  const ask = async (url: string, accept: string): Promise<Response | null> => {
    const host = new URL(url).host;

    for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
      const answer = await inTurn(host, async () =>
        fetchImpl(url, {
          headers: { 'user-agent': userAgent, accept },
          signal: AbortSignal.timeout(timeoutMs),
        }).catch(() => null),
      );

      if (answer === null) {
        return null;
      }

      if (answer.status !== 429 && answer.status !== 503) {
        return answer.ok ? answer : null;
      }

      await wait(BACKOFF_MS * 2 ** attempt);
    }

    return null;
  };

  return {
    json: async (url) => {
      const answer = await ask(url, 'application/json');
      const read = answer === null ? null : await answer.json().catch(() => null);
      const parsed = JsonValueSchema.safeParse(read);

      return answer === null || !parsed.success ? null : parsed.data;
    },

    bytes: async (url) => {
      const answer = await ask(url, 'image/*');

      if (answer === null) {
        return null;
      }

      const read = await answer.arrayBuffer().catch(() => null);

      return read === null || read.byteLength === 0 ? null : new Uint8Array(read);
    },
  };
};

export type { MusicWeb, WebFetch };

export { createMusicWeb };
