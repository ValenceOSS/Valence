import { DEFAULT_CUSTOM_TEMPLATES } from '@ValenceContracts/constants/DEFAULT_CUSTOM_TEMPLATES';
import type { CustomWebhook } from '@ValenceContracts/schemas/Webhook';

const DEFAULT_CUSTOM_WEBHOOK: CustomWebhook = {
  method: 'POST',
  format: 'json',
  template: DEFAULT_CUSTOM_TEMPLATES.json,
  headers: [],
  isSigned: true,
};

export { DEFAULT_CUSTOM_WEBHOOK };
