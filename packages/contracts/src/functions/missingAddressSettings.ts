import { settingsInAddress } from './settingsInAddress';
import { WEBHOOK_ADDRESS_SETTINGS } from '@ValenceContracts/schemas/Webhook';
import type { WebhookPreset } from '@ValenceContracts/schemas/Webhook';

/**
 * Names the settings a receiver needs that a webhook's address does not carry, such as the chat a
 * Telegram bot posts to.
 *
 * @param preset - The shape the webhook sends.
 * @param address - The webhook's address.
 * @returns The names of the settings missing from the address's query, in the receiver's own words.
 */
const missingAddressSettings = (preset: WebhookPreset, address: string): string[] => {
  const { required } = WEBHOOK_ADDRESS_SETTINGS[preset];
  const given = settingsInAddress(address, required);

  return required.filter((name) => given[name] === undefined);
};

export { missingAddressSettings };
