import { isCloudflareChallenge } from '@ValenceRequests/cardigann/isCloudflareChallenge';

type Standing = 'clear' | 'challenged' | 'blocked';

/**
 * Where a page leaves a request: through, stopped at Cloudflare's browser check, or refused
 * outright by the site's Cloudflare rules, which no browser gets past.
 *
 * @param status - The status it answered with.
 * @param server - Its `Server` header.
 * @param body - What it answered.
 * @returns Where the request stands.
 */
const standingOf = (status: number, server: string | null, body: string): Standing => {
  if (
    status === 403 &&
    (server ?? '').toLowerCase().includes('cloudflare') &&
    /you have been blocked|cf-error-details/i.test(body)
  ) {
    return 'blocked';
  }

  return isCloudflareChallenge(status, server, body) ? 'challenged' : 'clear';
};

export type { Standing };

export { standingOf };
