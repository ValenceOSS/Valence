import { DEFAULT_WEBHOOK_FILTERS } from '@ValenceContracts/schemas/Webhook';
import type { WebhookDraft } from './WebhookFields.types';

const A_NEW_WEBHOOK: WebhookDraft = {
  name: '',
  url: '',
  preset: 'generic',
  events: ['job.failed'],
  filters: DEFAULT_WEBHOOK_FILTERS,
};

export { A_NEW_WEBHOOK };
