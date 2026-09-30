import { say } from '@ValenceI18n/say';

const slowWaitChoices = [
  { id: '1', label: say('common.aDay') },
  { id: '3', label: say('common.threeDays') },
  { id: '7', label: say('common.aWeek') },
  { id: '14', label: say('common.twoWeeks') },
  { id: '30', label: say('common.aMonth') },
  { id: 'never', label: say('common.never') },
];

export { slowWaitChoices };
