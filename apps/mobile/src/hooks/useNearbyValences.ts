import { useEffect, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';
import { z } from 'zod';
import { VALENCE_SERVICE_TYPE } from '@ValenceContracts/constants/VALENCE_SERVICE_TYPE';
import { whicheverAnswers } from '@ValenceMobile/platform/whicheverAnswers';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';

type Nearby = {
  start: (type: string) => void;
  stop: () => void;
  addListener: (event: 'onChange', listener: (change: object) => void) => { remove: () => void };
};

const NearbyChangeSchema = z.object({
  nearby: z.array(z.object({ name: z.string(), host: z.string(), port: z.number() })),
});

/**
 * The Valence servers announcing themselves on the network this phone is on, as the desktop app
 * finds them, for somebody who would rather pick one than type its address.
 *
 * Each is offered only once it has answered as a Valence, since an announcement says where
 * something claims to be rather than that it is there, and each address is asked only once however
 * often the network is heard from again. A build without the browser offers nothing, and the
 * address can still be typed.
 *
 * @returns The servers found, named as they announce themselves.
 */
const useNearbyValences = (): NearbyValence[] => {
  const [nearby, setNearby] = useState<NearbyValence[]>([]);

  useEffect(() => {
    const browser = requireOptionalNativeModule<Nearby>('ValenceNearby');

    if (browser === null) {
      return undefined;
    }

    const asked = new Map<string, Promise<boolean>>();
    let heardLast = 0;
    let isGone = false;

    const listening = browser.addListener('onChange', (change) => {
      const read = NearbyChangeSchema.safeParse(change);

      if (!read.success) {
        return;
      }

      heardLast += 1;

      const heardNow = heardLast;
      const heard = read.data.nearby.map((one) => ({
        name: one.name,
        address: `http://${one.host}:${one.port.toString()}`,
      }));

      void Promise.all(
        heard.map(async (one) => {
          const answers =
            asked.get(one.address) ??
            whicheverAnswers([one.address]).then((answered) => answered !== null);

          asked.set(one.address, answers);

          return (await answers) ? one : null;
        }),
      ).then((answering) => {
        if (!isGone && heardNow === heardLast) {
          setNearby(answering.filter((one) => one !== null));
        }
      });
    });

    browser.start(VALENCE_SERVICE_TYPE);

    return () => {
      isGone = true;
      listening.remove();
      browser.stop();
    };
  }, []);

  return nearby;
};

export { useNearbyValences };
