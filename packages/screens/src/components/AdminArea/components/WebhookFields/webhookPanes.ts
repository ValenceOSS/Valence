import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const WEBHOOK_PANES = ['where', 'events', 'who'] as const;

type WebhookPane = (typeof WEBHOOK_PANES)[number];

const WEBHOOK_PANE_LABELS = [
  { id: 'where', labelKey: 'admin.webhookPanes.where' },
  { id: 'events', labelKey: 'admin.webhookPanes.events' },
  { id: 'who', labelKey: 'admin.webhookPanes.who' },
] as const satisfies readonly { id: WebhookPane; labelKey: StringKey }[];

/**
 * The webhook form's panes as a tab row lists them, in words read at the moment they are drawn.
 *
 * @returns One tab for each pane.
 */
const webhookPaneItems = (): { id: WebhookPane; label: string }[] =>
  WEBHOOK_PANE_LABELS.map((pane) => ({ id: pane.id, label: say(pane.labelKey) }));

/**
 * Whether a string a tab row handed back actually names one of the webhook form's panes.
 *
 * @param value - What was chosen.
 * @returns Whether it names a pane.
 */
const isWebhookPane = (value: string): value is WebhookPane =>
  WEBHOOK_PANES.some((pane) => pane === value);

export type { WebhookPane };
export { WEBHOOK_PANES, webhookPaneItems, isWebhookPane };
