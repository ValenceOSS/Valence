import { originIsAllowed } from '@ValenceServer/auth/originIsAllowed';

type SocketOrigin = {
  origin: string | undefined;
  host: string | undefined;
  forwardedHost: string | undefined;
  trusted: readonly string[];
};

/**
 * Whether a realtime socket is opened by something allowed to act as whoever's cookie it carries: a
 * page this server served, an origin the operator trusts, or an app, which sends no origin.
 *
 * A browser sends the cookie from any page on the same site, a sibling host or another port among
 * them, and a socket is not held back by the rules that keep such a page from reading answers. The
 * page's host is compared rather than its whole origin, since a proxy in front of the server speaks
 * https to the browser and plain http to it.
 *
 * @param asked - The origin the socket said it came from, the host it asked for, the host a proxy
 *   says it was asked for, and the origins this deployment trusts.
 * @returns Whether the socket may open.
 */
const isASocketFromHere = ({ origin, host, forwardedHost, trusted }: SocketOrigin): boolean => {
  if (origin === undefined || origin === '' || originIsAllowed(origin, trusted) !== null) {
    return true;
  }

  const from = URL.canParse(origin) ? new URL(origin).host.toLowerCase() : '';
  const here = [host, forwardedHost?.split(',')[0]]
    .map((one) => one?.trim().toLowerCase() ?? '')
    .filter((one) => one !== '');

  return from !== '' && here.includes(from);
};

export { isASocketFromHere };
