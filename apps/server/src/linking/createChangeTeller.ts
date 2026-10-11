import type { LinkService } from './LinkService';
import type { LinkSharingStore } from './LinkSharingStore';
import type { LinkStore } from './LinkStore';
import type { PeerClient } from './createPeerClient';

type LinkedChange = { libraryId?: string; serverId?: string };

type ChangeTellerOptions = {
  links: LinkStore;
  sharing: LinkSharingStore;
  linking: LinkService;
  peers: PeerClient;
};

/**
 * Tells the linked servers that something they read from this one has changed, so each reads it
 * again now rather than at its next pass: those a changed library is shared with, the one whose
 * share changed, or every one when this server itself changed, such as its name. A server that does
 * not answer is left to its next pass.
 *
 * @param options - The link store, what is shared, the link service and the peer client.
 * @returns A way to tell them, given the library or the linked server the change is about, or
 *   neither for this server itself.
 */
const createChangeTeller =
  ({ links, sharing, linking, peers }: ChangeTellerOptions) =>
  async ({ libraryId, serverId }: LinkedChange): Promise<void> => {
    for (const server of await links.listServers()) {
      const shared =
        server.state === 'linked' && libraryId !== undefined
          ? await sharing.readSharing(server.id)
          : null;
      const isTold =
        server.state === 'linked' &&
        (serverId === undefined || serverId === server.id) &&
        (libraryId === undefined || shared?.libraryIds.includes(libraryId) === true);
      const signed = isTold ? await linking.signFor(server.id) : null;

      if (signed !== null) {
        await peers.tellChanged(signed.address, signed.token);
      }
    }
  };

export type { ChangeTellerOptions, LinkedChange };

export { createChangeTeller };
