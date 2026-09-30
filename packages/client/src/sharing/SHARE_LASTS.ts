import { say } from '@ValenceI18n/say';

const SHARE_LASTS = [
  { id: '1', label: say('common.aDay') },
  { id: '3', label: say('common.threeDays') },
  { id: '7', label: say('common.aWeek') },
  { id: '30', label: say('common.aMonth') },
  { id: 'forever', label: say('client.sharing.shareLasts.untilIWithdrawIt') },
] as const;

export { SHARE_LASTS };
