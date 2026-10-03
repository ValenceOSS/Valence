import { LINKED_SCHEME } from './LINKED_SCHEME';

/**
 * Where something a linked server shares is read from, written where this server would keep a path
 * or an artwork address: the linked server, and the route on it the request is passed through to.
 * Nothing that reads files ever finds one, since nothing on a disk is named like it.
 *
 * @param serverId - The linked server.
 * @param route - The route on that server, from `/api`.
 * @returns The address.
 */
const linkedAddressOf = (serverId: string, route: string): string =>
  `${LINKED_SCHEME}${serverId}${route}`;

export { linkedAddressOf };
