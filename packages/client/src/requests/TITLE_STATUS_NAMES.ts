import type { TitleStatus } from '@ValenceContracts/schemas/AdminCatalogue';
import { say } from '@ValenceI18n/say';

const TITLE_STATUS_NAMES: Readonly<Record<TitleStatus, string>> = {
  library: say('common.inTheLibrary'),
  downloading: say('common.downloading'),
  queued: say('client.requests.titleStatusNames.queued'),
  missing: say('client.requests.titleStatusNames.nothingFound'),
  toApprove: say('client.requests.titleStatusNames.toApprove'),
  failed: say('common.failed'),
  notFollowed: say('client.requests.titleStatusNames.notFollowed'),
};

export { TITLE_STATUS_NAMES };
