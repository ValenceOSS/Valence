import type { PartyKind } from '@ValenceContracts/schemas/WatchParty';
import { say } from '@ValenceI18n/say';

type PartyWords = {
  title: string;
  isDoing: string;
  isPaused: string;
  notDoing: string;
  invitation: string;
  intro: string;
  start: string;
};

const PARTY_WORDS: Readonly<Record<PartyKind, PartyWords>> = {
  watch: {
    title: say('common.partyMenu.watchParty'),
    isDoing: say('common.watching'),
    isPaused: say('common.paused'),
    notDoing: say('common.partyPanel.notWatching'),
    invitation: say('common.partyPanel.anyoneHereCanWatchAlong'),
    intro: say('common.partyMenu.watchThisWithOtherPeopleHere'),
    start: say('common.partyMenu.startAWatchParty'),
  },
  listen: {
    title: say('common.listeningParty'),
    isDoing: say('common.partyPanel.listening'),
    isPaused: say('common.paused'),
    notDoing: say('common.partyPanel.notListening'),
    invitation: say('common.partyPanel.anyoneHereCanListenAlong'),
    intro: say('common.listeningPartyPanel.everybodyHearsWhatYouPlayWhere'),
    start: say('common.listeningPartyPanel.startAListeningParty'),
  },
};

export type { PartyWords };

export { PARTY_WORDS };
