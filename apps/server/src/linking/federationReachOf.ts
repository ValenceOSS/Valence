import { FEDERATION_PATH } from './FEDERATION_PATH';
import type { FederationReach, PeerClaimKind, PeerSubject } from './FederationReach';

const ID = '[0-9a-fA-F-]{36}';

const NAME = '[^/]+';

const PASSTHROUGH = '/api';

const PAIRING_ROUTES: readonly { method: string; path: RegExp }[] = [
  { method: 'GET', path: /^\/server$/ },
  { method: 'POST', path: /^\/pair$/ },
  { method: 'GET', path: new RegExp(`^/pair/${ID}$`) },
  { method: 'POST', path: /^\/unlink$/ },
];

const SERVER_ROUTES = [
  { method: 'GET', path: /^\/libraries$/, action: 'libraries' },
  { method: 'GET', path: /^\/activity$/, action: 'activity' },
  { method: 'POST', path: /^\/parties\/say$/, action: 'parties' },
  { method: 'GET', path: /^\/parties\/hear$/, action: 'parties' },
  { method: 'POST', path: /^\/parties\/asked$/, action: 'parties' },
  { method: 'POST', path: /^\/requests$/, action: 'requests' },
  { method: 'POST', path: /^\/direct$/, action: 'media' },
] as const;

const CATALOGUE_ROUTE = new RegExp(`^/catalogue/(${ID})$`);

const TICKET_ROUTE = /^\/direct\/[A-Za-z0-9_-]{32,64}\/[^/]+$/;

const SUBJECT_ROUTES: readonly { method: string; path: RegExp; kind: PeerSubject['kind'] }[] = [
  { method: 'GET', path: new RegExp(`^/api/media/(${ID})/image/[a-z]+$`), kind: 'item' },
  { method: 'GET', path: new RegExp(`^/api/media/(${ID})/segments$`), kind: 'item' },
  {
    method: 'GET',
    path: new RegExp(`^/api/media/(${ID})/subtitles(?:/${NAME}(?:/cues)?)?$`),
    kind: 'item',
  },
  { method: 'GET', path: new RegExp(`^/api/media/(${ID})/preview$`), kind: 'item' },
  {
    method: 'POST',
    path: new RegExp(`^/api/playback/(${ID})/(?:explain|session|trickplay)$`),
    kind: 'item',
  },
  {
    method: 'GET',
    path: new RegExp(`^/api/playback/(${ID})/(?:file|frame)$`),
    kind: 'item',
  },
  {
    method: 'GET',
    path: new RegExp(`^/api/music/tracks/(${ID})/(?:stream|lyrics)$`),
    kind: 'item',
  },
  { method: 'GET', path: new RegExp(`^/api/books/(${ID})/cover$`), kind: 'book' },
  {
    method: 'GET',
    path: new RegExp(
      `^/api/books/(${ID})/chapters/${ID}/(?:audio|contents|document|resource|pages/\\d+)$`,
    ),
    kind: 'book',
  },
  { method: 'GET', path: new RegExp(`^/api/music/albums/(${ID})/artwork$`), kind: 'album' },
  { method: 'GET', path: new RegExp(`^/api/music/artists/(${ID})/image$`), kind: 'artist' },
];

const CLAIMED_ROUTES: readonly { method: string; path: RegExp; claim: PeerClaimKind }[] = [
  { method: 'DELETE', path: new RegExp(`^/api/playback/session/(${NAME})$`), claim: 'session' },
  {
    method: 'POST',
    path: new RegExp(`^/api/playback/session/(${NAME})/heartbeat$`),
    claim: 'session',
  },
  {
    method: 'GET',
    path: new RegExp(`^/api/playback/session/(${NAME})/${NAME}$`),
    claim: 'session',
  },
  {
    method: 'GET',
    path: new RegExp(`^/api/playback/trickplay/(${NAME})/${NAME}$`),
    claim: 'trickplay',
  },
];

/**
 * What a request passed through to this server's own routes reaches: one of its titles, books,
 * albums or artists, which is checked against what is shared, or something the asking server
 * started here, such as a playback session, which is checked against what it started.
 *
 * @param method - The HTTP method.
 * @param inner - The path of the route it is passed through to.
 * @returns What it reaches.
 */
const passedThroughTo = (method: string, inner: string): FederationReach => {
  for (const route of SUBJECT_ROUTES) {
    const found = route.method === method ? route.path.exec(inner) : null;

    if (found?.[1] !== undefined) {
      return {
        kind: 'subject',
        action: 'media',
        subject: { kind: route.kind, id: found[1] },
        inner,
      };
    }
  }

  for (const route of CLAIMED_ROUTES) {
    const found = route.method === method ? route.path.exec(inner) : null;

    if (found?.[1] !== undefined) {
      return { kind: 'claimed', action: 'media', claim: route.claim, id: found[1], inner };
    }
  }

  return { kind: 'refused' };
};

/**
 * Decides what another server may ask this one for, in the same way a share link's reach is
 * decided: everything under the federation address is refused unless it is named here, so a route
 * added later is closed to every linked server until somebody deliberately opens it.
 *
 * The routes that pair two servers check their own tokens, since a server on its way to being
 * linked is not linked yet, so they are passed through as they are, as is a player streaming
 * directly from this server with a ticket in its address, which is believed as far as the ticket.
 * The rest name this server as a whole, a shared library's catalogue, or — under `/api` — one of
 * this server's own routes the request is passed through to, which only ever serves a title, book,
 * album or artist, or something the asking server started; never a list, an account, a setting or
 * anything that writes.
 *
 * @param method - The HTTP method.
 * @param path - The request path.
 * @returns What the request reaches, or that it reaches nothing.
 */
const federationReachOf = (method: string, path: string): FederationReach => {
  if (!path.startsWith(`${FEDERATION_PATH}/`)) {
    return { kind: 'refused' };
  }

  const within = path.slice(FEDERATION_PATH.length);
  const asked = method.toUpperCase();

  if (PAIRING_ROUTES.some((route) => route.method === asked && route.path.test(within))) {
    return { kind: 'pairing' };
  }

  if (asked === 'GET' && TICKET_ROUTE.test(within)) {
    return { kind: 'ticket' };
  }

  const server = SERVER_ROUTES.find((route) => route.method === asked && route.path.test(within));

  if (server !== undefined) {
    return { kind: 'server', action: server.action };
  }

  const catalogue = asked === 'GET' ? CATALOGUE_ROUTE.exec(within) : null;

  if (catalogue?.[1] !== undefined) {
    return { kind: 'catalogue', action: 'catalogue', libraryId: catalogue[1] };
  }

  return within.startsWith(`${PASSTHROUGH}/`)
    ? passedThroughTo(asked, within)
    : { kind: 'refused' };
};

export { federationReachOf };
