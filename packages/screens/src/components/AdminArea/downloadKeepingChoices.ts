import type { StringKey } from '@ValenceI18n/StringKey';

const downloadKeepingChoices: readonly { id: string; labelKey: StringKey }[] = [
  { id: '1', labelKey: 'admin.downloadKeepingChoices.day' },
  { id: '7', labelKey: 'admin.downloadKeepingChoices.week' },
  { id: '14', labelKey: 'admin.downloadKeepingChoices.twoWeeks' },
  { id: '30', labelKey: 'admin.downloadKeepingChoices.month' },
  { id: '90', labelKey: 'admin.downloadKeepingChoices.threeMonths' },
  { id: '0', labelKey: 'admin.downloadKeepingChoices.untilDeleted' },
];

export { downloadKeepingChoices };
