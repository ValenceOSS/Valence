import { headersFor } from './headersFor';

const PEEKS_FOR_MS = 8000;

/**
 * Whether a stream is HLS, which a browser can be handed through this server as it is, rather than
 * something that has to be made into HLS first, such as a tuner's MPEG-TS or an RTSP feed. An
 * address ending `.m3u8` says so; an HTTP address that does not is asked, and its first bytes read.
 *
 * @param address - Where the stream is.
 * @param asking - The user agent and referrer the stream insists on, if any.
 * @param fetcher - How a request is sent, injectable for tests.
 * @returns Whether it is HLS.
 */
const isHlsAddress = async (
  address: string,
  asking: { userAgent: string | null; referrer: string | null },
  fetcher: typeof fetch = fetch,
): Promise<boolean> => {
  if (!/^https?:\/\//iu.test(address)) {
    return false;
  }

  if (/\.m3u8?(\?|$)/iu.test(new URL(address).pathname)) {
    return true;
  }

  try {
    const response = await fetcher(address, {
      headers: headersFor(asking),
      signal: AbortSignal.timeout(PEEKS_FOR_MS),
    });
    const reader = response.body?.getReader();
    const first = reader === undefined ? undefined : await reader.read();

    const bytes: Uint8Array = first?.value instanceof Uint8Array ? first.value : new Uint8Array();

    await reader?.cancel();

    return (
      /mpegurl/iu.test(response.headers.get('content-type') ?? '') ||
      new TextDecoder().decode(bytes).trimStart().startsWith('#EXTM3U')
    );
  } catch {
    return false;
  }
};

export { isHlsAddress };
