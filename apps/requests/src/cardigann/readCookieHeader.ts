const ATTRIBUTES = new Set([
  'comment',
  'commenturl',
  'domain',
  'expires',
  'max-age',
  'path',
  'port',
  'secure',
  'version',
  'httponly',
  'samesite',
  'partitioned',
  'priority',
]);

/**
 * Reads cookies written as a browser sends them — `uid=1; pass=abc` — which is how somebody pastes the
 * cookie a site needs into its settings. Attributes such as `path=/` are not cookies and are left out.
 *
 * @param header - The cookies as written.
 * @returns Each cookie's value by its name.
 */
const readCookieHeader = (header: string): Record<string, string> =>
  Object.fromEntries(
    [...header.matchAll(/([^()<>@,;:\\"/[\]?={}\s]+)=([^,;\\"\s]*)/g)].flatMap(
      ([, name = '', value = '']) => (ATTRIBUTES.has(name.toLowerCase()) ? [] : [[name, value]]),
    ),
  );

export { readCookieHeader };
