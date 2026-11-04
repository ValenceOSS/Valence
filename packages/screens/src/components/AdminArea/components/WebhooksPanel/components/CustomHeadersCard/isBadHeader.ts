import { CustomWebhookHeaderSchema } from '@ValenceContracts/schemas/Webhook';
import type { CustomWebhookHeader } from '@ValenceContracts/schemas/Webhook';

/**
 * Whether a header with a name could not be sent: a name that isn't a header name or is one Valence
 * sets itself, or a value holding a line break.
 *
 * @param header - The header.
 * @returns Whether it is bad; a header with no name yet is not, though it waits to be named.
 */
const isBadHeader = (header: CustomWebhookHeader): boolean =>
  header.name.trim() !== '' && !CustomWebhookHeaderSchema.safeParse(header).success;

export { isBadHeader };
