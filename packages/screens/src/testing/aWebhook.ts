import type { WebhookSubscription } from '@ValenceContracts/schemas/Webhook';

/**
 * A webhook for a test: a Discord one sending failed jobs, never used yet, with anything the test
 * cares about changed.
 *
 * @param overrides - What to change.
 * @returns The webhook.
 */
const aWebhook = (overrides: Partial<WebhookSubscription> = {}): WebhookSubscription => ({
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  name: 'Discord',
  url: 'https://discord.com/api/webhooks/1/abc',
  preset: 'discord',
  events: ['job.failed'],
  filters: { mediaAdded: 'perScan', accounts: [], profiles: [], itemTypes: [] },
  custom: null,
  reachesLocalNetwork: false,
  enabled: true,
  createdAt: '2026-08-14T20:00:00.000Z',
  lastAttemptAt: null,
  lastStatus: null,
  lastError: null,
  ...overrides,
});

export { aWebhook };
