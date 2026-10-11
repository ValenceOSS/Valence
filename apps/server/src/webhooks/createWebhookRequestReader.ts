import { webhookRequestOf } from './webhookRequestOf';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { WebhookRequest } from '@ValenceContracts/schemas/Webhook';

/**
 * What a webhook says about a request, with the Discord account of whoever asked for it where theirs
 * carries one, so a Discord webhook can mention them whatever has happened to it.
 *
 * @param discordIdOf - Reads the Discord ID on an account, where there is a way to.
 * @returns A way to describe a request for webhooks.
 */
const createWebhookRequestReader =
  (discordIdOf?: (userId: string) => Promise<string | null>) =>
  async (request: MediaRequest): Promise<WebhookRequest> => ({
    ...webhookRequestOf(request),
    requestedByDiscordId: (await discordIdOf?.(request.requestedBy.id).catch(() => null)) ?? null,
  });

export { createWebhookRequestReader };
