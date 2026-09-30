import { say } from '@ValenceI18n/say';

const SHARE_CAPS = [
  { id: 'any', label: say('client.sharing.shareCaps.anybodyWithTheLink') },
  { id: '1', label: say('client.sharing.shareCaps.onePerson') },
  { id: '2', label: say('client.sharing.shareCaps.twoPeople') },
  { id: '5', label: say('client.sharing.shareCaps.fivePeople') },
] as const;

export { SHARE_CAPS };
