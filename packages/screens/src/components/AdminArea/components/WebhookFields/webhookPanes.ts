const WEBHOOK_PANES = ['where', 'events', 'who'] as const;

type WebhookPane = (typeof WEBHOOK_PANES)[number];

const WEBHOOK_PANE_ITEMS = [
  { id: 'where', label: 'Where' },
  { id: 'events', label: 'Events' },
  { id: 'who', label: 'Who' },
] as const;

/**
 * Whether a string a tab row handed back actually names one of the webhook form's panes.
 *
 * @param value - What was chosen.
 * @returns Whether it names a pane.
 */
const isWebhookPane = (value: string): value is WebhookPane =>
  WEBHOOK_PANES.some((pane) => pane === value);

export type { WebhookPane };
export { WEBHOOK_PANES, WEBHOOK_PANE_ITEMS, isWebhookPane };
