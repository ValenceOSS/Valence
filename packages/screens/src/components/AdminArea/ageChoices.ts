import type { StringKey } from '@ValenceI18n/StringKey';

const AGE_CHOICES: readonly { id: string; labelKey: StringKey; detailKey: StringKey }[] = [
  { id: 'none', labelKey: 'admin.ageChoices.none', detailKey: 'admin.ageChoices.noneDetail' },
  { id: '0', labelKey: 'admin.ageChoices.all', detailKey: 'admin.ageChoices.allDetail' },
  { id: '8', labelKey: 'admin.ageChoices.upTo8', detailKey: 'admin.ageChoices.upTo8Detail' },
  { id: '12', labelKey: 'admin.ageChoices.upTo12', detailKey: 'admin.ageChoices.upTo12Detail' },
  { id: '15', labelKey: 'admin.ageChoices.upTo15', detailKey: 'admin.ageChoices.upTo15Detail' },
  { id: '18', labelKey: 'admin.ageChoices.upTo18', detailKey: 'admin.ageChoices.upTo18Detail' },
];

export { AGE_CHOICES };
