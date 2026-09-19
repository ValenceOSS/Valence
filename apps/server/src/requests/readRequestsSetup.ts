type RequestsSetup =
  | { kind: 'off' }
  | { kind: 'incomplete'; missing: 'REQUESTS_URL' | 'REQUESTS_SECRET' }
  | { kind: 'on'; address: string; secret: string };

const SHORTEST_SECRET = 32;

/**
 * Decides whether requesting is on, from the two variables that switch it on.
 *
 * Both have to be there: an address with no secret could not be spoken to, and a secret with no
 * address has nowhere to go. Having one without the other is a mistake worth naming at startup
 * rather than a server that quietly carries on without requests.
 *
 * @param address - `REQUESTS_URL`, where the service answers.
 * @param secret - `REQUESTS_SECRET`, what it was started with.
 * @returns Whether requesting is on, and if not quite, what is missing.
 */
const readRequestsSetup = (address: string, secret: string): RequestsSetup => {
  if (address === '' && secret === '') {
    return { kind: 'off' };
  }

  if (address === '') {
    return { kind: 'incomplete', missing: 'REQUESTS_URL' };
  }

  if (secret.length < SHORTEST_SECRET) {
    return { kind: 'incomplete', missing: 'REQUESTS_SECRET' };
  }

  return { kind: 'on', address, secret };
};

export type { RequestsSetup };

export { readRequestsSetup };
