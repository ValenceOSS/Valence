import { headersFor } from './headersFor';
import type { LiveHealth } from '@ValenceContracts/schemas/LiveTv';

const WAITS_MS = 12_000;

/**
 * Whether a page's headers forbid it being shown inside another site's page, as `X-Frame-Options`
 * and a `frame-ancestors` that does not let everybody in each say.
 *
 * @param headers - The page's headers.
 * @returns Whether it may be framed.
 */
const isFramable = (headers: Headers): boolean => {
  const frameOptions = (headers.get('x-frame-options') ?? '').trim().toLowerCase();
  const ancestors = /frame-ancestors([^;]*)/iu.exec(headers.get('content-security-policy') ?? '');

  if (frameOptions === 'deny' || frameOptions === 'sameorigin') {
    return false;
  }

  return ancestors === null || ancestors[1]?.trim().split(/\s+/u).includes('*') === true;
};

/**
 * Whether an embedded channel's page is there to show, and whether it lets itself be shown inside
 * Valence: a page that answers but forbids framing is refused, since the browser would draw it blank.
 *
 * @param address - The page.
 * @param asking - The user agent and referrer to ask with.
 * @param fetcher - How to ask.
 * @returns How the channel is, and whether its page may be framed.
 */
const checkEmbed = async (
  address: string,
  asking: { userAgent: string | null; referrer: string | null },
  fetcher: typeof fetch,
): Promise<{ health: LiveHealth; isFramable: boolean }> => {
  const response = await fetcher(address, {
    headers: headersFor(asking),
    signal: AbortSignal.timeout(WAITS_MS),
  }).catch(() => null);

  void response?.body?.cancel().catch(() => undefined);

  if (response === null) {
    return { health: 'unreachable', isFramable: true };
  }

  if (response.status === 404 || response.status === 410) {
    return { health: 'gone', isFramable: true };
  }

  if (response.status === 401 || response.status === 403 || response.status === 451) {
    return { health: 'refused', isFramable: true };
  }

  if (!response.ok) {
    return { health: 'unreachable', isFramable: true };
  }

  return isFramable(response.headers)
    ? { health: 'onAir', isFramable: true }
    : { health: 'refused', isFramable: false };
};

export { checkEmbed };
