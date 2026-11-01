import { say } from '@ValenceI18n/say';
import type { WebhookBrand } from './WebhookBrand';

/**
 * How the server signs its webhook messages: by the name and accent its administrator gave it under
 * Branding, else as Valence, with its logo — else Valence's icon — fetched from its public address,
 * which only an address over https gives, since a receiver such as Discord fetches the picture
 * itself and cannot reach a server that is only on this network.
 *
 * @param address - The server's public address.
 * @param brand - The name and accent its administrator chose, where they chose them.
 * @param logo - Where the server serves its own logo, where it has one.
 * @returns The brand.
 */
const webhookBrandOf = (
  address: string,
  brand: { name: string | null; accent: string | null },
  logo: string | null,
): WebhookBrand => {
  const parsed = URL.parse(address);

  return {
    name: brand.name ?? say('common.valence'),
    iconUrl:
      parsed === null || parsed.protocol !== 'https:'
        ? null
        : new URL(logo ?? '/icon.png', parsed).toString(),
    accent: brand.accent === null ? null : Number.parseInt(brand.accent.slice(1), 16),
  };
};

export { webhookBrandOf };
