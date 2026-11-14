import { isPublicAddress } from '@ValenceCore/network/isPublicAddress';
import { readBodyUpTo } from '@ValenceCore/network/readBodyUpTo';
import { createPinnedFetch } from '@ValenceServer/web/createPinnedFetch';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { nameOfSource } from '@ValenceServer/sources/nameOfSource';
import { isPublicWebAddress } from '@ValenceServer/live/isPublicWebAddress';
import { reportStatus } from '@ValenceServer/sources/reportStatus';
import { troubleWatch } from '@ValenceServer/sources/troubleWatch';
import type { Resolve } from '@ValenceServer/live/isPublicWebAddress';
import type { TroubleReason } from '@ValenceServer/sources/SourceTrouble';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type WebFetch = (
  url: string,
  init: {
    headers: Record<string, string>;
    signal: AbortSignal;
    method?: 'POST';
    body?: string;
    redirect?: 'manual';
  },
) => Promise<Response>;

type MusicWeb = {
  json: (url: string) => Promise<JsonValue | null>;
  reachJson?: (url: string) => Promise<JsonValue | null | undefined>;
  bytes: (url: string) => Promise<Uint8Array | null>;
  text: (url: string) => Promise<string | null>;
  failures?: () => number;
};

type QueryWeb = {
  post: (url: string, body: JsonValue) => Promise<JsonValue | null>;
};

type MusicWebOptions = {
  userAgent: string;
  spacingMs: Readonly<Record<string, number>>;
  fetchImpl?: WebFetch;
  wait?: (ms: number) => Promise<void>;
  now?: () => number;
  timeoutMs?: number;
  resolve?: Resolve;
};

const DEFAULT_SPACING_MS = 250;

const MOST_REDIRECTS = 3;

const MOST_BODY_BYTES = 32 * 1024 * 1024;

const RETRIES = 2;

const GIVES_UP_AFTER_MS = 20_000;

const BACKOFF_MS = 2000;

const LIMITS_WITH_503 = new Set(['musicbrainz.org']);

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
 * what was asked for all come back as nothing. It counts the times nothing came back because a site
 * could not be reached or was failing, apart from a site saying it has nothing, so a caller can
 * tell "not found" from "could not ask". What went wrong — a rate limit, a refusal, a fault or no
 * answer at all — is reported to the trouble watch as well, so a cache does not keep it and a
 * search can say why it found nothing.
 *
 * Pictures and pages are fetched only from public addresses, checked again at every redirect, and
 * only up to thirty-two mebibytes of them are read.
 *
 * @param options - Who to say is asking, how far apart to space each site's requests, how long to
 *   wait for an answer, and — for a test — how to fetch, wait and tell the time.
 * @returns A way to ask for JSON, and one that answers nothing at all where the site couldn't be
 *   reached, apart from null where it refused; to send a query for JSON; to ask for a picture and a page; and how many asks so
 *   far could not be answered.
 */
const createMusicWeb = ({
  userAgent,
  spacingMs,
  fetchImpl,
  wait = async (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = () => Date.now(),
  timeoutMs = GIVES_UP_AFTER_MS,
  resolve,
}: MusicWebOptions): MusicWeb & QueryWeb => {
  const plain: WebFetch = fetchImpl ?? ((url, init) => fetch(url, init));
  const pinned: WebFetch =
    fetchImpl ??
    createPinnedFetch(
      isPublicAddress,
      () => new TypeError('that address is not on the public internet'),
    );
  const nextAllowed = new Map<string, number>();
  const queues = new Map<string, Promise<void>>();
  let failed = 0;

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

  const sentChecked = async (
    url: string,
    init: Parameters<WebFetch>[1],
  ): Promise<Response | null> => {
    let at = url;

    for (let hop = 0; hop <= MOST_REDIRECTS; hop += 1) {
      if (!(await isPublicWebAddress(at, resolve))) {
        return null;
      }

      const answer = await pinned(at, { ...init, redirect: 'manual' });
      const location = answer.headers.get('location');

      if (answer.status < 300 || answer.status >= 400 || location === null) {
        return answer;
      }

      void answer.body?.cancel();
      at = new URL(location, at).toString();
    }

    return null;
  };

  const reach = async (
    url: string,
    accept: string,
    body: JsonValue | null = null,
    isChecked = false,
  ): Promise<Response | null | undefined> => {
    const host = new URL(url).host;
    let status = 0;

    const failing = (reason: TroubleReason) => {
      failed += 1;
      troubleWatch.report({ source: nameOfSource(url), reason });

      return undefined;
    };

    for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
      const init = {
        headers: {
          'user-agent': userAgent,
          accept,
          ...(body === null ? {} : { 'content-type': 'application/json' }),
        },
        signal: AbortSignal.timeout(timeoutMs),
        ...(body === null ? {} : { method: 'POST' as const, body: JSON.stringify(body) }),
      };
      const answer = await inTurn(host, async () =>
        (isChecked ? sentChecked(url, init) : plain(url, init)).catch(() => null),
      );

      if (answer === null) {
        return failing('unreachable');
      }

      ({ status } = answer);

      if (status !== 429 && status !== 503) {
        if (status >= 500) {
          return failing('faulty');
        }

        reportStatus(url, status);

        return answer.ok ? answer : null;
      }

      await wait(BACKOFF_MS * 2 ** attempt);
    }

    return failing(
      status === 429 || (status === 503 && LIMITS_WITH_503.has(host)) ? 'rateLimited' : 'faulty',
    );
  };

  const ask = async (
    url: string,
    accept: string,
    body: JsonValue | null = null,
    isChecked = false,
  ): Promise<Response | null> => {
    const answer = await reach(url, accept, body, isChecked);

    return answer ?? null;
  };

  const readJson = async (answer: Response | null): Promise<JsonValue | null> => {
    const read = answer === null ? null : await answer.json().catch(() => null);
    const parsed = JsonValueSchema.safeParse(read);

    return answer === null || !parsed.success ? null : parsed.data;
  };

  return {
    failures: () => failed,

    json: async (url) => readJson(await ask(url, 'application/json')),

    reachJson: async (url) => {
      const answer = await reach(url, 'application/json');

      return answer === undefined ? undefined : readJson(answer);
    },

    post: async (url, body) => readJson(await ask(url, 'application/json', body)),

    bytes: async (url) => {
      const answer = await ask(url, 'image/*', null, true);
      const read = answer === null ? null : await readBodyUpTo(answer, MOST_BODY_BYTES);

      return read === null || read.byteLength === 0 ? null : read;
    },

    text: async (url) => {
      const answer = await ask(url, 'text/html', null, true);
      const read = answer === null ? null : await readBodyUpTo(answer, MOST_BODY_BYTES);

      return read === null ? null : new TextDecoder().decode(read);
    },
  };
};

export type { MusicWeb, QueryWeb, WebFetch };

export { createMusicWeb };
