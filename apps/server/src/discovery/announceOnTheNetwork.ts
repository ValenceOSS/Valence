import { say } from '@ValenceI18n/say';
import { hostname } from 'node:os';
import { Bonjour } from 'bonjour-service';
import { VALENCE_SERVICE_TYPE } from '@ValenceContracts/constants/VALENCE_SERVICE_TYPE';

type Announcement = {
  on: (event: 'error', listener: (error: Error) => void) => void;
};

type Announcer = {
  publish: (config: { name: string; type: string; port: number }) => Announcement;
  unpublishAll: (done?: () => void) => void;
  destroy: (done?: () => void) => void;
};

/**
 * What this server is called on the network, for a client to show somebody choosing between two.
 *
 * Only the machine's own label is used. A host name often carries whatever domain the network gave
 * it — `.local`, `.localdomain`, a router's own — which says nothing to somebody picking a server,
 * and a dot inside an announced name is turned into something stranger still.
 *
 * @param host - The machine's own name.
 * @returns The name to announce.
 */
const nameOnTheNetwork = (host: string): string =>
  say('server.discovery.name', { host: host.split('.')[0] ?? host });

/**
 * Tells machines on the same network that there is a Valence here, and on which port, so a client
 * opened on another of them can offer it rather than asking for an address.
 *
 * This is an announcement rather than something found: the server says where it is, the way a
 * printer or a speaker does, and a client listens for it. Nobody's machine is knocked on to find it.
 * A server that should not be seen — one reached through a proxy, or run somewhere a household does
 * not share a network with — is started with the announcement turned off.
 *
 * Failing to announce is not failing to start. A container with no route to the network, or a
 * network that drops multicast, leaves somebody typing the address, which is what they did before;
 * so what goes wrong is told and the server carries on.
 *
 * Stopping says goodbye rather than going quiet. A client that only noticed the silence would go on
 * offering a server that had gone for as long as the last announcement said to trust it, which is
 * minutes; told goodbye, it can take the server off the list at once.
 *
 * @param port - Where the server listens.
 * @param warn - Told what went wrong, where something did.
 * @param makeAnnouncer - What does the announcing, which a test replaces.
 * @returns How to stop announcing, told once the goodbye has been said.
 */
const announceOnTheNetwork = (
  port: number,
  warn: (message: string) => void,
  makeAnnouncer: (onError: (error: Error) => void) => Announcer = (onError) =>
    new Bonjour({}, onError),
): ((done?: () => void) => void) => {
  const failed = (error: Error) => {
    // eslint-disable-next-line valence/no-hard-coded-strings -- a log line
    warn(`Could not announce this server on the network: ${error.message}`);
  };

  const announcer = makeAnnouncer(failed);

  announcer
    .publish({ name: nameOnTheNetwork(hostname()), type: VALENCE_SERVICE_TYPE, port })
    .on('error', failed);

  return (done) => {
    announcer.unpublishAll(() => {
      announcer.destroy(done);
    });
  };
};

export type { Announcer };

export { announceOnTheNetwork, nameOnTheNetwork };
