import { headersFor } from './headersFor';

const PROBES_FOR_MS = 10_000;

type StreamHealth = 'hls' | 'dash' | 'other' | 'refused' | 'gone' | 'unreachable' | 'notAStream';

/**
 * Asks a channel's stream whether it will play, before anybody waits on it, and says why not where
 * it will not: refused outright, as a broadcaster does outside the countries it sends to; gone, as
 * an out-of-date playlist's streams are; not answering at all; or answering with a page rather than
 * a stream. A stream that is not HTTP cannot be asked this way, and is left to try.
 *
 * @param address - Where the stream is.
 * @param asking - The user agent and referrer it insists on.
 * @param fetcher - How a request is sent.
 * @returns Whether it is HLS or DASH, something else to make into HLS, or why it will not play.
 */
const probeStream = async (
  address: string,
  asking: { userAgent: string | null; referrer: string | null },
  fetcher: typeof fetch = fetch,
): Promise<StreamHealth> => {
  if (!/^https?:\/\//iu.test(address)) {
    return 'other';
  }

  const response = await fetcher(address, {
    headers: headersFor(asking),
    signal: AbortSignal.timeout(PROBES_FOR_MS),
  }).catch(() => null);

  if (response === null) {
    return 'unreachable';
  }

  if (response.status === 401 || response.status === 403 || response.status === 451) {
    void response.body?.cancel();

    return 'refused';
  }

  if (response.status === 404 || response.status === 410) {
    void response.body?.cancel();

    return 'gone';
  }

  if (!response.ok) {
    void response.body?.cancel();

    return 'unreachable';
  }

  const type = response.headers.get('content-type') ?? '';
  const reader = response.body?.getReader();
  const first = reader === undefined ? undefined : await reader.read().catch(() => undefined);
  const bytes: Uint8Array = first?.value instanceof Uint8Array ? first.value : new Uint8Array();

  await reader?.cancel().catch(() => undefined);

  const start = new TextDecoder().decode(bytes.slice(0, 512)).trimStart();

  if (/mpegurl/iu.test(type) || start.startsWith('#EXTM3U')) {
    return 'hls';
  }

  if (/dash\+xml/iu.test(type) || /<MPD\b/u.test(start)) {
    return 'dash';
  }

  return /text\/html/iu.test(type) || start.startsWith('<') ? 'notAStream' : 'other';
};

export type { StreamHealth };

export { probeStream };
