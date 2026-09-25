import { say } from '@ValenceI18n/say';

const SHARE_LASTS = [
  {
    id: '1',
    get label() {
      return say('client.shareLasts.day');
    },
  },
  {
    id: '3',
    get label() {
      return say('client.shareLasts.threeDays');
    },
  },
  {
    id: '7',
    get label() {
      return say('client.shareLasts.week');
    },
  },
  {
    id: '30',
    get label() {
      return say('client.shareLasts.month');
    },
  },
  {
    id: 'forever',
    get label() {
      return say('client.shareLasts.untilWithdrawn');
    },
  },
] as const;

export { SHARE_LASTS };
