import { say } from '@ValenceI18n/say';

const ACCOUNT_PANELS = [
  { id: 'profile', label: say('common.profile') },
  { id: 'security', label: say('common.security') },
  { id: 'devices', label: say('common.devices') },
  { id: 'links', label: say('common.links') },
  { id: 'history', label: say('common.history') },
  { id: 'hidden', label: say('common.hidden') },
] as const;

export { ACCOUNT_PANELS };
