import { readLinkedAddress } from '@ValenceServer/linking/catalogue/readLinkedAddress';
import { signAsPerson } from '@ValenceServer/linking/signAsPerson';
import type { LinkService } from '@ValenceServer/linking/LinkService';
import type { LinkSharingStore } from '@ValenceServer/linking/LinkSharingStore';
import type { PeerClient } from '@ValenceServer/linking/createPeerClient';
import type { PersonScope } from './createPersonScope';

type Asking = { method?: string; headers?: Headers; body?: ArrayBuffer };

/**
 * Asks a linked server for something one of its titles is made of — a picture, a stream, a page —
 * as whoever on this server the request is for, through the route on that server it is passed on
 * to. Answers with nothing where the server is not linked or cannot be reached, which every caller
 * reads as there being nothing there.
 *
 * @param linking - The link service, which signs.
 * @param sharing - What this server shares with each, where the names setting is kept.
 * @param peers - How this server talks to the others.
 * @param people - Who the request is for.
 * @returns The asker: by server and route, or by a linked address.
 */
const createLinkedAsker = ({
  linking,
  sharing,
  peers,
  people,
}: {
  linking: LinkService;
  sharing: LinkSharingStore;
  peers: PeerClient;
  people: PersonScope;
}) => {
  const ask = async (serverId: string, route: string, asking: Asking = {}) => {
    const signed = await signAsPerson(linking, sharing, serverId, await people.current());

    return signed === null
      ? null
      : peers.passThrough(signed.address, signed.token, route, {
          method: asking.method ?? 'GET',
          headers: asking.headers ?? new Headers(),
          ...(asking.body === undefined ? {} : { body: asking.body }),
        });
  };

  return {
    ask,
    askAt: async (address: string, asking: Asking = {}) => {
      const linked = readLinkedAddress(address);

      return linked === null ? null : ask(linked.serverId, linked.route, asking);
    },
  };
};

type LinkedAsker = ReturnType<typeof createLinkedAsker>;

export type { Asking, LinkedAsker };

export { createLinkedAsker };
