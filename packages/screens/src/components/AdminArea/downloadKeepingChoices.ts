import { say } from '@ValenceI18n/say';

const downloadKeepingChoices = [
  { id: '1', label: say('common.aDay') },
  { id: '7', label: say('common.aWeek') },
  { id: '14', label: say('common.twoWeeks') },
  { id: '30', label: say('common.aMonth') },
  { id: '90', label: say('screens.adminArea.downloadKeepingChoices.threeMonths') },
  { id: '0', label: say('screens.adminArea.downloadKeepingChoices.untilDeleted') },
];

export { downloadKeepingChoices };
