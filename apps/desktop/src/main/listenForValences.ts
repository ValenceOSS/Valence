import { networkInterfaces } from 'node:os';
import { Bonjour } from 'bonjour-service';
import { VALENCE_SERVICE_TYPE } from '@ValenceContracts/constants/VALENCE_SERVICE_TYPE';
import { isAValence } from '@ValenceDesktop/main/lookForAValence';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';

const AN_IPV4_ADDRESS = /^\d{1,3}(?:\.\d{1,3}){3}$/u;

type Announced = {
  name: string;
  port: number;
  addresses?: string[];
  referer?: { address: string };
};

type Browsing = {
  whenUp: (listener: (service: Announced) => void) => void;
  whenDown: (listener: (service: Announced) => void) => void;
  stop: () => void;
};

type Listening = {
  onChange: (nearby: NearbyValence[]) => void;
  onThisMachine: (address: string) => void;
  reach?: (address: string) => Promise<boolean>;
  ownAddresses?: () => ReadonlySet<string>;
  browse?: () => Browsing;
};

/**
 * Every address this machine holds, for telling an announcement from somewhere else on the network
 * apart from one this machine made itself.
 *
 * @returns The addresses of every interface this machine has.
 */
const theseMachinesAddresses = (): ReadonlySet<string> =>
  new Set(
    Object.values(networkInterfaces()).flatMap((held) => (held ?? []).map((one) => one.address)),
  );

/**
 * Which of the addresses an announcement came with this client can reach it on.
 *
 * The one the answer arrived from is tried first, since it demonstrably reached here. Only IPv4 is
 * used: an IPv6 address on a home network is usually link-local, which cannot be written into an
 * address without naming the interface it belongs to — and none of the addresses a browser would show
 * somebody look like that. A self-assigned address is left out for the same reason; it is what a
 * machine takes when nothing on the network would give it one.
 *
 * @param service - What was announced.
 * @returns The address to ask, or nothing where there is none this client can use.
 */
const whereItAnswers = (service: Announced): string | null =>
  [service.referer?.address, ...(service.addresses ?? [])].find(
    (address): address is string =>
      address !== undefined && AN_IPV4_ADDRESS.test(address) && !address.startsWith('169.254.'),
  ) ?? null;

/**
 * Listens on the network for what Valence servers there announce, via the library that speaks the
 * protocol they announce with.
 *
 * Its own socket's failures are swallowed. Listening is a convenience added to a screen that already
 * asks for an address, and a network that drops multicast should leave that screen exactly as it was
 * rather than take the window down with it.
 *
 * @returns What is heard, and how to stop hearing it.
 */
const browseForValences = (): Browsing => {
  const bonjour = new Bonjour({}, () => undefined);
  const browser = bonjour.find({ type: VALENCE_SERVICE_TYPE });

  return {
    whenUp: (listener) => {
      browser.on('up', listener);
    },
    whenDown: (listener) => {
      browser.on('down', listener);
    },
    stop: () => {
      browser.stop();
      bonjour.destroy();
    },
  };
};

/**
 * Hears the Valence servers on the same network, for offering beside the one on this machine.
 *
 * This is the other half of what a server does when it announces itself: nothing here goes looking,
 * it only hears what servers chose to say. Asking every machine on a network whether it is running
 * Valence would be a scan, which is not ours to do on a network somebody else may share.
 *
 * What is heard is asked before it is offered, the same as the server on this machine is, so that
 * pressing one connects rather than leading to a screen saying nothing answered. A server that says
 * goodbye is taken off at once, including one still being asked about.
 *
 * A server this machine announced is this machine's rather than the network's. It is offered as the
 * one found here, at `localhost`, which is where somebody at this machine would reach it — and which
 * finds one on a port the search of this machine never looks at.
 *
 * @param listening - Who to tell what was heard, and what to hear it with, which a test replaces.
 * @returns How to stop listening.
 */
const listenForValences = ({
  onChange,
  onThisMachine,
  reach = isAValence,
  ownAddresses = theseMachinesAddresses,
  browse = browseForValences,
}: Listening): (() => void) => {
  const heard = new Map<string, NearbyValence>();
  const stillAnnounced = new Set<string>();

  const tell = () => {
    onChange([...heard.values()]);
  };

  const browsing = browse();

  browsing.whenUp((service) => {
    const where = whereItAnswers(service);

    if (where === null) {
      return;
    }

    const port = service.port.toString();
    const isThisMachine = ownAddresses().has(where);
    const address = isThisMachine ? `http://localhost:${port}` : `http://${where}:${port}`;

    stillAnnounced.add(service.name);

    void reach(address).then((answered) => {
      if (!answered || !stillAnnounced.has(service.name)) {
        return;
      }

      if (isThisMachine) {
        onThisMachine(address);

        return;
      }

      heard.set(service.name, { address, name: service.name });
      tell();
    });
  });

  browsing.whenDown((service) => {
    stillAnnounced.delete(service.name);

    if (heard.delete(service.name)) {
      tell();
    }
  });

  return () => {
    browsing.stop();
  };
};

export type { Announced, Browsing };

export { listenForValences, whereItAnswers };
