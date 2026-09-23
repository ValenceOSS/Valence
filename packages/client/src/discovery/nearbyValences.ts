import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';

type Tracking = {
  reach: (address: string) => Promise<boolean>;
  onChange: (nearby: NearbyValence[]) => void;
};

type NearbyValences = {
  arrived: (name: string, address: string, isOffered?: boolean) => Promise<boolean>;
  left: (name: string) => void;
};

/**
 * Keeps the list of Valence servers heard on the network, for whichever client is listening.
 *
 * Each client hears announcements its own way — the desktop through a Node library, a television
 * through the system's own Bonjour — but what it does with them is the same, and lives here once.
 *
 * A server is asked before it is offered, so pressing one connects rather than leading to a screen
 * saying nothing answered. One that says goodbye is taken off at once, including one still being
 * asked about: an answer that arrives after the goodbye is not an invitation to put it back.
 *
 * A client may hear a server it would rather not list here — its own machine's, which belongs under
 * a different heading — so arriving can be asked about without being offered, and says whether it
 * answered either way.
 *
 * @param tracking - How to ask whether a Valence answers, and who to tell the list whenever it changes.
 * @returns What to call as servers arrive and leave.
 */
const nearbyValences = ({ reach, onChange }: Tracking): NearbyValences => {
  const heard = new Map<string, NearbyValence>();
  const stillAnnounced = new Set<string>();

  const tell = () => {
    onChange([...heard.values()]);
  };

  return {
    arrived: async (name, address, isOffered = true) => {
      stillAnnounced.add(name);

      const answered = await reach(address);

      if (!answered || !stillAnnounced.has(name)) {
        return false;
      }

      if (isOffered) {
        heard.set(name, { address, name });
        tell();
      }

      return true;
    },
    left: (name) => {
      stillAnnounced.delete(name);

      if (heard.delete(name)) {
        tell();
      }
    },
  };
};

export type { NearbyValences };

export { nearbyValences };
