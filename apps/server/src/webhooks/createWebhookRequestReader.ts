import { webhookRequestOf } from './webhookRequestOf';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { WebhookRequest } from '@ValenceContracts/schemas/Webhook';

/**
 * What a webhook says about a request, with the Discord account of everybody who asked for it where
 * theirs carries one, so a Discord webhook can mention each of them.
 *
 * @param discordIdOf - Reads the Discord ID on an account, where there is a way to.
 * @returns A way to describe a request for webhooks.
 */
const createWebhookRequestReader =
  (discordIdOf?: (userId: string) => Promise<string | null>) =>
  async (request: MediaRequest): Promise<WebhookRequest> => {
    const described = webhookRequestOf(request);
    const accountIds = [...new Set(described.askers.map((asker) => asker.accountId))];
    const discordIds = new Map(
      await Promise.all(
        accountIds.map(
          async (accountId) =>
            [accountId, (await discordIdOf?.(accountId).catch(() => null)) ?? null] as const,
        ),
      ),
    );

    return {
      ...described,
      requestedByDiscordId: discordIds.get(request.requestedBy.id) ?? null,
      askers: described.askers.map((asker) => ({
        ...asker,
        discordId: discordIds.get(asker.accountId) ?? null,
      })),
    };
  };

export { createWebhookRequestReader };
