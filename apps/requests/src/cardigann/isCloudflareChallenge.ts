/**
 * Whether a site answered with Cloudflare's browser check rather than the page, which no plain
 * request gets past.
 *
 * @param status - The status it answered with.
 * @param server - Its `Server` header.
 * @param body - What it answered.
 * @returns Whether it is the check.
 */
const isCloudflareChallenge = (status: number, server: string | null, body: string): boolean =>
  (status === 403 || status === 503 || status === 429) &&
  (server ?? '').toLowerCase().includes('cloudflare') &&
  /<title>(Just a moment|Attention Required)|challenge-platform|cf-browser-verification|cf_chl_opt/i.test(
    body,
  );

export { isCloudflareChallenge };
