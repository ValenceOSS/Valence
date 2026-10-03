import { say } from '@ValenceI18n/say';

const INTERVAL_UNITS = [
  { id: 'minutes', label: say('screens.adminArea.addTriggerDialog.minutes') },
  { id: 'hours', label: say('screens.adminArea.addTriggerDialog.hours') },
] as const;

export { INTERVAL_UNITS };
