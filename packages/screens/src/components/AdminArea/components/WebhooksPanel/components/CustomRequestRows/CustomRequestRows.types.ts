import type { CustomWebhook } from '@ValenceContracts/schemas/Webhook';

type CustomRequestRowsProps = {
  setup: CustomWebhook;
  onChange: (next: CustomWebhook) => void;
};

export type { CustomRequestRowsProps };
