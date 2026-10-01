type SeerrServer = {
  address: string;
  hostname: string;
  port: string;
  isSsl: boolean;
  urlBase: string;
};

/**
 * What to type into Overseerr's or Jellyseerr's dialog for adding a Radarr or Sonarr server, for
 * reaching Valence where this page was opened from.
 *
 * @param origin - Where this page was opened from, such as `https://valence.example.com`.
 * @param base - Where the stand-in answers on it, such as `/arr/radarr`.
 * @returns The whole address, and its hostname, port, whether it is over SSL, and its base.
 */
const seerrServerOf = (origin: string, base: string): SeerrServer => {
  const url = new URL(origin);
  const isSsl = url.protocol === 'https:';

  return {
    address: `${url.origin}${base}`,
    hostname: url.hostname,
    port: url.port === '' ? (isSsl ? '443' : '80') : url.port,
    isSsl,
    urlBase: base,
  };
};

export { seerrServerOf };

export type { SeerrServer };
