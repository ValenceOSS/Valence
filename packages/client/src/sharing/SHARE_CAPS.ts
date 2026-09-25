import { say } from '@ValenceI18n/say';

const SHARE_CAPS = [
  {
    id: 'any',
    get label() {
      return say('client.shareCaps.anybody');
    },
  },
  {
    id: '1',
    get label() {
      return say('client.shareCaps.onePerson');
    },
  },
  {
    id: '2',
    get label() {
      return say('client.shareCaps.two');
    },
  },
  {
    id: '5',
    get label() {
      return say('client.shareCaps.five');
    },
  },
] as const;

export { SHARE_CAPS };
