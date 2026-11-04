import type { CustomWebhook, WebhookEvent } from '@ValenceContracts/schemas/Webhook';

type CustomMessageCardProps = {
  setup: CustomWebhook;
  subscribed: readonly WebhookEvent[];
  url: string;
  onSave: (template: string) => Promise<boolean>;
};

export type { CustomMessageCardProps };
