import type { CustomWebhookHeader } from '@ValenceContracts/schemas/Webhook';

type CustomHeadersCardProps = {
  saved: readonly CustomWebhookHeader[];
  onSave: (headers: CustomWebhookHeader[]) => Promise<boolean>;
};

export type { CustomHeadersCardProps };
