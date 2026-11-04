import { say } from '@ValenceI18n/say';
import type { WebhookPreset } from '@ValenceContracts/schemas/Webhook';

const WEBHOOK_SERVICE_NAMES: Readonly<Record<WebhookPreset, string>> = {
  generic: say('screens.adminArea.webhookFields.generic'),
  discord: say('screens.adminArea.webhookFields.discord'),
  slack: say('screens.adminArea.webhookFields.slack'),
  telegram: say('screens.adminArea.webhookFields.telegram'),
  ntfy: say('screens.adminArea.webhookFields.ntfy'),
  gotify: say('screens.adminArea.webhookFields.gotify'),
  pushover: say('screens.adminArea.webhookFields.pushover'),
  apprise: say('screens.adminArea.webhookFields.apprise'),
  custom: say('screens.adminArea.addLibraryDialog.custom'),
};

export { WEBHOOK_SERVICE_NAMES };
