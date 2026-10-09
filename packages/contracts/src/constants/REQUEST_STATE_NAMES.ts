import type { MediaRequestState } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

const REQUEST_STATE_NAMES: Readonly<Record<MediaRequestState, string>> = {
  awaitingApproval: say('client.requests.nameTheStanding.waitingForApproval'),
  refused: say('common.refused'),
  waiting: say('common.requested'),
  wanted: say('client.requests.titleStatusNames.missing'),
  searching: say('common.searching'),
  chosen: say('common.downloading'),
  downloading: say('common.downloading'),
  filing: say('common.filing'),
  filed: say('common.filing'),
  available: say('common.inTheLibrary'),
  failed: say('common.failed'),
};

export { REQUEST_STATE_NAMES };
