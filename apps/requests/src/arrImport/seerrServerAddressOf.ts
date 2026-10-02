import type { SeerrArrServer } from '@ValenceRequests/arrImport/schemas/SeerrArrServerSchema';

/**
 * Where a Radarr or Sonarr that Overseerr or Jellyseerr sends requests to answers, from the host,
 * port, encryption and base it keeps for it.
 *
 * @param server - The server, as Overseerr or Jellyseerr keeps it.
 * @returns Its address.
 */
const seerrServerAddressOf = (server: SeerrArrServer): string => {
  const host = server.hostname.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const base = (server.baseUrl ?? '').replace(/^\/+|\/+$/g, '');

  return `${server.useSsl ? 'https' : 'http'}://${host}:${server.port.toString()}${base === '' ? '' : `/${base}`}`;
};

export { seerrServerAddressOf };
