type DevHost = { address: string; port: number };

const ENTRY = /^([a-z0-9.-]+)=([0-9a-f.:]+|\[[0-9a-f:]+\]):(\d{1,5})$/i;

/**
 * Reads `VALENCE_DEV_HOSTS`, which on a developer's machine points a public name at a local
 * service — `files.example.test=127.0.0.1:8443` — so a plugin and the files it hands back can be
 * tried against a stand-in without the name being real. Such a host is reached over plain HTTP and
 * skips the public-address check, so it is refused outright on a production server.
 *
 * @param value - What the variable holds, if anything.
 * @param environment - `NODE_ENV`.
 * @returns Each name and where it really is.
 */
const readDevHosts = (
  value: string | undefined,
  environment: string | undefined,
): ReadonlyMap<string, DevHost> => {
  const entries = (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

  if (entries.length === 0) {
    return new Map();
  }

  if (environment === 'production') {
    throw new Error('VALENCE_DEV_HOSTS is for development and is refused in production.');
  }

  return new Map(
    entries.map((entry) => {
      const match = ENTRY.exec(entry);
      const port = Number(match?.[3]);

      if (match?.[1] === undefined || match[2] === undefined || port < 1 || port > 65_535) {
        throw new Error(`VALENCE_DEV_HOSTS has ${entry}, which is not host=address:port.`);
      }

      return [match[1].toLowerCase(), { address: match[2].replace(/^\[|\]$/g, ''), port }] as const;
    }),
  );
};

export type { DevHost };

export { readDevHosts };
