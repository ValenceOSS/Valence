import type { FederationOutcome } from '@ValenceContracts/schemas/LinkSharing';
import { say } from '@ValenceI18n/say';

const FEDERATION_OUTCOME_NAMES: Readonly<Record<FederationOutcome, string>> = {
  allowed: say('common.allowed'),
  notShared: say('common.federationOutcome.notShared'),
  aboveTheAge: say('common.federationOutcome.aboveTheAge'),
  blocked: say('common.blocked'),
  tooMany: say('common.federationOutcome.tooMany'),
};

export { FEDERATION_OUTCOME_NAMES };
