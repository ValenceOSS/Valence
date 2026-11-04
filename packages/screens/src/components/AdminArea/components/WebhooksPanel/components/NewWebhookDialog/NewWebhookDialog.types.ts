import type { NewWebhook, Refusal } from '@ValenceClient/admin/fetchWebhooks';

type NewWebhookDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (webhook: NewWebhook) => Promise<Refusal>;
};

export type { NewWebhookDialogProps };
