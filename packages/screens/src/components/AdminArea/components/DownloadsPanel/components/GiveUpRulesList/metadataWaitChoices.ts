import { say } from '@ValenceI18n/say';

const metadataWaitChoices = [
  { id: '15', label: say('screens.giveUpRulesList.metadataWaitChoices.fifteenMinutes') },
  { id: '30', label: say('screens.giveUpRulesList.metadataWaitChoices.halfAnHour') },
  { id: '60', label: say('common.anHour') },
  { id: '180', label: say('common.threeHours') },
  { id: '360', label: say('common.sixHours') },
  { id: '1440', label: say('common.aDay') },
  { id: 'never', label: say('common.never') },
];

export { metadataWaitChoices };
