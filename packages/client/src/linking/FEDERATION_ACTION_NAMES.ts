import type { FederationAction } from '@ValenceContracts/schemas/LinkSharing';
import { say } from '@ValenceI18n/say';

const FEDERATION_ACTION_NAMES: Readonly<Record<FederationAction, string>> = {
  libraries: say('common.federationAction.libraries'),
  activity: say('common.federationAction.activity'),
  catalogue: say('common.federationAction.catalogue'),
  media: say('common.federationAction.media'),
  parties: say('common.federationAction.parties'),
  requests: say('common.federationAction.requests'),
};

export { FEDERATION_ACTION_NAMES };
