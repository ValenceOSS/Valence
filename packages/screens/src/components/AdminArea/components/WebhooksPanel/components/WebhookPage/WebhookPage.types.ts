import type { WebhookDelivery, WebhookSubscription } from '@ValenceContracts/schemas/Webhook';
import type { CreatedWebhook, Refusal, WebhookChange } from '@ValenceClient/admin/fetchWebhooks';
import type { WebhookFilterChoice } from '@ValenceScreens/components/AdminArea/components/WebhooksPanel/WebhookFilterChoice.types';

type WebhookPageProps = {
  webhook: WebhookSubscription;
  created: CreatedWebhook | null;
  deliveries: WebhookDelivery[];
  isHistoryLoading: boolean;
  accounts: WebhookFilterChoice[];
  profiles: WebhookFilterChoice[];
  hasRequests: boolean;
  onBack: () => void;
  onEdit: (id: string, change: WebhookChange) => Promise<Refusal>;
  onSetEnabled: (enabled: boolean) => void;
  onTest: () => void;
  onDelete: () => void;
  onRedeliver: (deliveryId: string) => void;
  onDismissCreated: () => void;
};

export type { WebhookPageProps };
