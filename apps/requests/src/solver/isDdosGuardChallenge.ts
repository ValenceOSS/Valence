/**
 * Whether a site answered with DDoS-Guard's browser check rather than the page, which a browser
 * gets past by waiting while the check runs.
 *
 * @param status - The status it answered with.
 * @param server - Its `Server` header.
 * @param body - What it answered.
 * @returns Whether it is the check.
 */
const isDdosGuardChallenge = (status: number, server: string | null, body: string): boolean =>
  (status === 403 || status === 503) &&
  (server ?? '').toLowerCase().includes('ddos-guard') &&
  /<title>DDoS-Guard|ddos-guard\.net|ddg_/i.test(body);

export { isDdosGuardChallenge };
