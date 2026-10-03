import { say } from '@ValenceI18n/say';

const TRIGGER_TYPES = [
  { id: 'daily', label: say('screens.adminArea.addTriggerDialog.daily') },
  { id: 'weekly', label: say('common.weekly') },
  { id: 'interval', label: say('screens.adminArea.addTriggerDialog.onAnInterval') },
  { id: 'startup', label: say('common.onApplicationStartup') },
] as const;

export { TRIGGER_TYPES };
