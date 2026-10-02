import type { LinkState } from '@ValenceContracts/schemas/LinkedServer';
import { say } from '@ValenceI18n/say';

const LINK_STATE_NAMES: Readonly<Record<LinkState, string>> = {
  awaitingThem: say('common.linkState.awaitingThem'),
  awaitingUs: say('common.linkState.awaitingUs'),
  linked: say('common.linkState.linked'),
  refused: say('common.refused'),
  unlinkedByThem: say('common.linkState.unlinkedByThem'),
};

export { LINK_STATE_NAMES };
