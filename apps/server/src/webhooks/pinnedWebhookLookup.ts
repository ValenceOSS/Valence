import { lookup } from 'node:dns';
import type { LookupAddress, LookupOptions } from 'node:dns';
import { isWebhookAddressAllowed } from './isWebhookAddressAllowed';
import { say } from '@ValenceI18n/say';

type LookupAnswer = (
  error: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

/**
 * Builds the name lookup a delivery connects through, which keeps only the addresses a webhook may
 * be sent to, so the address checked is the very address connected to.
 *
 * @param reachesLocalNetwork - Whether the webhook is allowed to reach the local network.
 * @returns A lookup in the shape Node's connect asks for.
 */
const pinnedWebhookLookup =
  (reachesLocalNetwork: boolean) =>
  (hostname: string, options: LookupOptions, answer: LookupAnswer): void => {
    lookup(hostname, { ...options, all: true, verbatim: true }, (error, addresses) => {
      if (error !== null) {
        answer(error, []);

        return;
      }

      const allowed = addresses.filter(({ address }) =>
        isWebhookAddressAllowed(address, reachesLocalNetwork),
      );
      const first = allowed[0];

      if (first === undefined) {
        const couldBeAllowed = addresses.some(({ address }) =>
          isWebhookAddressAllowed(address, true),
        );

        answer(
          new Error(
            say(
              couldBeAllowed
                ? 'error.webhook.valenceWillNotSendToTheLocalNetwork'
                : 'error.common.valenceWillNotSendDeliveriesTo',
            ),
          ),
          [],
        );

        return;
      }

      if (options.all === true) {
        answer(null, allowed);

        return;
      }

      answer(null, first.address, first.family);
    });
  };

export { pinnedWebhookLookup };
