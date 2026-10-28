import { WEBHOOK_ADDRESS_SETTINGS } from '@ValenceContracts/schemas/Webhook';
import type { WebhookPreset } from '@ValenceContracts/schemas/Webhook';

/**
 * The address a delivery is posted to: the subscription's own, less the settings Valence moves into
 * the message body, so that keys such as Pushover's are not sent twice or left in a receiver's logs.
 *
 * @param preset - The shape the subscription sends.
 * @param address - The subscription's address, as it was given.
 * @returns The address to post to.
 */
const addressToSend = (preset: WebhookPreset, address: string): string => {
  const parsed = URL.parse(address);
  const { required, optional, isMovedToBody } = WEBHOOK_ADDRESS_SETTINGS[preset];

  if (parsed === null || !isMovedToBody) {
    return address;
  }

  for (const name of [...required, ...optional]) {
    parsed.searchParams.delete(name);
  }

  return parsed.toString();
};

export { addressToSend };
