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
 * @param version - This server's version, added to the icon's address so a receiver that keeps
 *   pictures by address, as Discord does, fetches the icon again after an update.
 * @returns The brand.
 */
const webhookBrandOf = (
  address: string,
  brand: { name: string | null; accent: string | null },
  logo: string | null,
  version: string,
): WebhookBrand => {
  const parsed = URL.parse(address);

  return {
    name: brand.name ?? say('common.valence'),
    url:
      parsed === null || (parsed.protocol !== 'https:' && parsed.protocol !== 'http:')
        ? null
        : parsed.origin,
    iconUrl:
      parsed === null || parsed.protocol !== 'https:'
        ? null
        : new URL(logo ?? `/icon.png?v=${encodeURIComponent(version)}`, parsed).toString(),
    accent: brand.accent === null ? null : Number.parseInt(brand.accent.slice(1), 16),
  };
};

export { webhookBrandOf };
