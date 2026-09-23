import { requireOptionalNativeModule } from 'expo';
import type { NativeModule } from 'expo';
import { z } from 'zod';
import { nearbyValences } from '@ValenceClient/discovery/nearbyValences';
import { isAValence } from '@ValenceTv/native/isAValence';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';

type Said = Record<string, string | number>;

type DiscoveryEvents = {
  onFound: (said: Said) => void;
  onLost: (said: Said) => void;
};

declare class ValenceDiscovery extends NativeModule<DiscoveryEvents> {
  start(): void;
  stop(): void;
}

const FoundSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive(),
});

const LostSchema = z.object({ name: z.string().min(1) });

const discovery = requireOptionalNativeModule<ValenceDiscovery>('ValenceDiscovery');

/**
 * Hears the Valence servers announced on this television's network, and tells what is there each
 * time that changes.
 *
 * The system's own Bonjour does the hearing, through the one native module this needs; what is done
 * with a server once it is heard is the same as on the desktop, and shared with it. A build without
 * the module — a test, or a platform that has none — hears nothing, and the screen still asks for an
 * address.
 *
 * @param onChange - Told every server heard that has answered and not yet said goodbye.
 * @returns How to stop listening.
 */
const listenForValences = (onChange: (nearby: NearbyValence[]) => void): (() => void) => {
  if (discovery === null) {
    return () => undefined;
  }

  const nearby = nearbyValences({ reach: isAValence, onChange });

  const found = discovery.addListener('onFound', (said) => {
    const read = FoundSchema.safeParse(said);

    if (read.success) {
      void nearby.arrived(read.data.name, `http://${read.data.host}:${read.data.port.toString()}`);
    }
  });

  const lost = discovery.addListener('onLost', (said) => {
    const read = LostSchema.safeParse(said);

    if (read.success) {
      nearby.left(read.data.name);
    }
  });

  discovery.start();

  return () => {
    found.remove();
    lost.remove();
    discovery.stop();
  };
};

export { listenForValences };
