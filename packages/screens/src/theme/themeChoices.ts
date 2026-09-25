import { say } from '@ValenceI18n/say';

const THEME_CHOICES = [
  {
    id: 'system',
    get label() {
      return say('screens.themeChoices.system');
    },
  },
  {
    id: 'light',
    get label() {
      return say('screens.themeChoices.light');
    },
  },
  {
    id: 'dark',
    get label() {
      return say('screens.themeChoices.dark');
    },
  },
] as const;

export { THEME_CHOICES };
