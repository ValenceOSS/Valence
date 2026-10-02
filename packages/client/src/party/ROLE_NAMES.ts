import type { PartyRole } from '@ValenceContracts/schemas/WatchParty';
import { say } from '@ValenceI18n/say';

const ROLE_NAMES: Readonly<Record<PartyRole, string>> = {
  host: say('common.partyPanel.host'),
  coHost: say('common.partyPanel.coHost'),
  guest: say('common.partyPanel.guest'),
};

export { ROLE_NAMES };
