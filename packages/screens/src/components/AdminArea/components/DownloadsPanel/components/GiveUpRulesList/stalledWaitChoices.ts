import { say } from '@ValenceI18n/say';

const stalledWaitChoices = [
  { id: '1', label: say('common.anHour') },
  { id: '3', label: say('common.threeHours') },
  { id: '6', label: say('common.sixHours') },
  { id: '12', label: say('screens.giveUpRulesList.stalledWaitChoices.twelveHours') },
  { id: '24', label: say('common.aDay') },
  { id: '72', label: say('common.threeDays') },
  { id: 'never', label: say('common.never') },
];

export { stalledWaitChoices };
