import { say } from '@ValenceI18n/say';
import type { WebhookSubscription } from '@ValenceContracts/schemas/Webhook';

/**
 * How a webhook's last delivery went, as a badge.
 *
 * @param webhook - The webhook.
 * @returns The badge's tone and word.
 */
const lastDeliveryOf = (
  webhook: WebhookSubscription,
): { tone: 'success' | 'danger' | 'quiet'; label: string } =>
  webhook.lastAttemptAt === null
    ? { tone: 'quiet', label: say('common.neverUsed') }
    : webhook.lastError === null
      ? { tone: 'success', label: say('screens.webhooksPanel.deliveryHistory.delivered') }
      : { tone: 'danger', label: say('requests.indexers.indexerService.failing') };

export { lastDeliveryOf };
