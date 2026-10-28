import { resolvesSafely } from './resolvesSafely';

const POSTER_LIMIT_BYTES = 5_242_880;

const POSTER_TIMEOUT_MILLISECONDS = 5000;

type PosterAttachment = {
  base64: string;
  type: string;
};

type PosterRequest = (
  url: string,
  init: { redirect: 'manual'; headers: Record<string, string>; signal: AbortSignal },
) => Promise<Response>;

/**
 * Reads a response's body up to a limit, giving up as soon as it is passed rather than holding
 * however much a host chooses to send.
 *
 * @param response - The response.
 * @param limit - The most to read, in bytes.
 * @returns The body, or nothing where it was over the limit.
 */
const readUpTo = async (response: Response, limit: number): Promise<Buffer | null> => {
  if (response.body === null) {
    return null;
  }

  const chunks: Uint8Array[] = [];
  let length = 0;

  for await (const chunk of response.body) {
    if (!(chunk instanceof Uint8Array)) {
      return null;
    }

    length += chunk.length;

    if (length > limit) {
      return null;
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

/**
 * Fetches a poster to attach to a notification, as Seerr does for Pushover. The poster's address is
 * held to the same checks as a webhook's, no redirect is followed, and anything that is not a picture,
 * is over Pushover's five megabytes or is slow to arrive is passed over, so the notification is sent
 * without it rather than not at all.
 *
 * @param url - Where the poster is, if anywhere.
 * @param request - How to make the request, so a test need not open a socket.
 * @returns The poster in base64 with its type, or nothing.
 */
const fetchPosterAttachment = async (
  url: string | null,
  request: PosterRequest = fetch,
): Promise<PosterAttachment | null> => {
  if (url === null || !(await resolvesSafely(url))) {
    return null;
  }

  try {
    const response = await request(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'Valence' },
      signal: AbortSignal.timeout(POSTER_TIMEOUT_MILLISECONDS),
    });
    const type = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';

    if (!response.ok || !type.startsWith('image/')) {
      return null;
    }

    const bytes = await readUpTo(response, POSTER_LIMIT_BYTES);

    return bytes === null || bytes.length === 0 ? null : { base64: bytes.toString('base64'), type };
  } catch {
    return null;
  }
};

export { fetchPosterAttachment };

export type { PosterAttachment, PosterRequest };
