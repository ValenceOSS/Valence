import type { PartyKind } from '@ValenceContracts/schemas/WatchParty';
import { say } from '@ValenceI18n/say';

type PartyWords = {
  title: string;
  doing: 'common.partyPanel.countWatching' | 'common.partyPanel.countListening';
  isDoing: string;
  notDoing: string;
  invitation: string;
  intro: string;
  start: string;
};

const PARTY_WORDS: Readonly<Record<PartyKind, PartyWords>> = {
  watch: {
    title: say('common.partyMenu.watchParty'),
    doing: 'common.partyPanel.countWatching',
    isDoing: say('common.watching'),
    notDoing: say('common.partyPanel.notWatching'),
    invitation: say('common.partyPanel.sendThisToWatchAlong'),
    intro: say('common.partyMenu.watchThisWithOtherPeopleHere'),
    start: say('common.partyMenu.startAWatchParty'),
  },
  listen: {
    title: say('common.listeningParty'),
    doing: 'common.partyPanel.countListening',
    isDoing: say('common.partyPanel.listening'),
    notDoing: say('common.partyPanel.notListening'),
    invitation: say('common.partyPanel.sendThisToListenAlong'),
    intro: say('common.listeningPartyPanel.everybodyHearsWhatYouPlayWhere'),
    start: say('common.listeningPartyPanel.startAListeningParty'),
  },
};

export type { PartyWords };

export { PARTY_WORDS };
