import { webhookFormSchema } from './webhookFormSchema';
import type { WebhookDraft } from './WebhookFields.types';

/**
 * Which of the webhook dialog's panes holds the first thing wrong with it, so a refused send can show
 * that pane rather than leave the problem out of sight on the other one.
 *
 * @param draft - The webhook as it stands.
 * @returns The pane to show, or null where nothing is wrong.
 */
const paneOfFirstProblem = (draft: WebhookDraft): 'where' | 'events' | null => {
  const checked = webhookFormSchema.safeParse(draft);

  if (checked.success) {
    return null;
  }

  return checked.error.issues[0]?.path[0] === 'events' ? 'events' : 'where';
};

export { paneOfFirstProblem };
