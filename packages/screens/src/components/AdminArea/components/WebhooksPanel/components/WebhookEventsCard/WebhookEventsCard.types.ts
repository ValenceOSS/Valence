import type { WebhookSubscribableEvent } from '@ValenceContracts/schemas/Webhook';

type WebhookEventsCardProps = {
  events: readonly WebhookSubscribableEvent[];
  offered: readonly WebhookSubscribableEvent[];
  hasRequests: boolean;
  onChange: (next: WebhookSubscribableEvent[]) => void;
};

export type { WebhookEventsCardProps };
