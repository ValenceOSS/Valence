import { say } from '@ValenceI18n/say';

const THEME_CHOICES = [
  { id: 'system', label: say('common.system') },
  { id: 'light', label: say('common.light') },
  { id: 'dark', label: say('common.dark') },
] as const;

export { THEME_CHOICES };
