import { say } from '@ValenceI18n/say';

const STILL_WATCHING_CHOICES = [
  {
    id: 'off',
    get label() {
      return say('client.stillWatchingChoices.never');
    },
  },
  { id: '2', label: '2' },
  { id: '3', label: '3' },
  { id: '4', label: '4' },
  { id: '6', label: '6' },
] as const;

export { STILL_WATCHING_CHOICES };
